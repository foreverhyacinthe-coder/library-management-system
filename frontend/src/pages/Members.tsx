import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Search, Edit2, Eye, UserX, Loader2,
  Users, Mail, Phone, Hash, ShieldCheck, ShieldOff, X
} from 'lucide-react';
import { getUsers, createUser, updateUser } from '../api/usersApi';
import { getBorrows } from '../api/borrowsApi';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import type { User, Borrow } from '../types';

type Role = 'member' | 'librarian' | 'admin';

const roleColor: Record<string, string> = {
  admin: 'badge-danger', librarian: 'badge-teal', member: 'badge-blue',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

export default function Members() {
  const { showToast } = useToast();
  const [users, setUsers]     = useState<User[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [page, setPage]       = useState(1);
  const LIMIT = 12;

  const [viewUser, setViewUser]   = useState<User | null>(null);
  const [viewBorrows, setViewBorrows] = useState<Borrow[]>([]);
  const [editUser, setEditUser]   = useState<User | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [deactUser, setDeactUser] = useState<User | null>(null);

  const [form, setForm] = useState<Partial<User> & { password?: string }>({
    name:'', email:'', password:'', role:'member', phone:'', address:'',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ search, role, page, limit: LIMIT });
      setUsers(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch { showToast('error', 'Failed to load members.'); }
    finally { setLoading(false); }
  }, [search, role, page]);

  useEffect(() => { load(); }, [load]);

  const openView = async (u: User) => {
    setViewUser(u);
    try {
      const res = await getBorrows({ member: u._id, limit: 10 });
      setViewBorrows(res.data.data ?? []);
    } catch { setViewBorrows([]); }
  };

  const openEdit = (u: User) => {
    setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone ?? '', address: u.address ?? '' });
    setEditUser(u);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { showToast('error', 'Name and email are required.'); return; }
    setSaving(true);
    try {
      if (editUser) {
        await updateUser(editUser._id, { name: form.name, email: form.email, role: form.role as Role, phone: form.phone, address: form.address });
        showToast('success', 'Member updated.');
        setEditUser(null);
      } else {
        if (!form.password) { showToast('error', 'Password is required.'); setSaving(false); return; }
        await createUser({ name: form.name!, email: form.email!, password: form.password!, role: (form.role ?? 'member') as Role, phone: form.phone, address: form.address });
        showToast('success', 'Member created.');
        setShowAdd(false);
      }
      load();
    } catch (e: unknown) {
      showToast('error', (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    if (!deactUser) return;
    try {
      await updateUser(deactUser._id, { isActive: !deactUser.isActive });
      showToast('success', `Member ${deactUser.isActive ? 'deactivated' : 'activated'}.`);
      setDeactUser(null); load();
    } catch { showToast('error', 'Failed to update status.'); }
  };

  const pages = Math.ceil(total / LIMIT);

  const UserForm = () => (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
        <div className="form-group" style={{ gridColumn:'span 2' }}>
          <label className="form-label">Full Name *</label>
          <input className="form-input" value={form.name ?? ''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="First and last name" />
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" value={form.email ?? ''} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" />
        </div>
        {!editUser && (
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" value={form.password ?? ''} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-select" value={form.role ?? 'member'} onChange={e=>setForm(f=>({...f,role:e.target.value as Role}))}>
            <option value="member">Member</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={form.phone ?? ''} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+27 ..." />
        </div>
        <div className="form-group" style={{ gridColumn:'span 2' }}>
          <label className="form-label">Address</label>
          <input className="form-input" value={form.address ?? ''} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Street, city" />
        </div>
      </div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{total} registered member{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name:'', email:'', password:'', role:'member', phone:'', address:'' }); setShowAdd(true); }}>
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      <div className="filters-row">
        <div className="filter-search">
          <Search size={15} />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} />
        </div>
        <select className="filter-select" value={role} onChange={e=>{setRole(e.target.value);setPage(1);}}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="librarian">Librarian</option>
          <option value="member">Member</option>
        </select>
        {(search || role) && (
          <button className="btn btn-sm btn-ghost" onClick={()=>{setSearch('');setRole('');setPage(1);}}><X size={14} /> Clear</button>
        )}
      </div>

      <div className="table-wrap">
        {loading
          ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48, gap:10, color:'var(--text-muted)' }}>
              <Loader2 size={20} style={{ animation:'spin 0.9s linear infinite' }} /> Loading…
            </div>
          : users.length === 0
            ? <div className="empty-state">
                <div className="empty-state-icon"><Users size={28}/></div>
                <h3>No members found</h3>
                <p>Try adjusting your search filters.</p>
                <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><UserPlus size={15}/> Add Member</button>
              </div>
            : <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>ID</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ cursor:'pointer' }} onClick={()=>openView(u)}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34,height:34,borderRadius:'99px',background:'linear-gradient(135deg,var(--blue) 0%,var(--teal) 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.78rem',fontWeight:700,flexShrink:0 }}>
                            {u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                          <div>
                            <div style={{ fontWeight:600 }}>{u.name}</div>
                            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily:'monospace', fontSize:'0.82rem', color:'var(--text-muted)' }}>{u.membershipId ?? '—'}</td>
                      <td><span className={`badge ${roleColor[u.role] ?? 'badge-neutral'}`}>{u.role}</span></td>
                      <td style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>{u.phone ?? '—'}</td>
                      <td style={{ fontSize:'0.88rem', color:'var(--text-secondary)' }}>{fmtDate(u.createdAt)}</td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={()=>openView(u)}><Eye size={15}/></button>
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={()=>openEdit(u)}><Edit2 size={15}/></button>
                          <button className="btn btn-icon btn-ghost btn-sm" style={{ color: u.isActive ? 'var(--danger)' : 'var(--success)' }} onClick={()=>setDeactUser(u)}>
                            {u.isActive ? <UserX size={15}/> : <ShieldCheck size={15}/>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }
        {!loading && pages > 1 && (
          <div className="pagination">
            <span className="pagination-info">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
              {Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(p=>(
                <button key={p} className={`page-btn${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* View Member Modal */}
      <Modal open={!!viewUser} onClose={()=>setViewUser(null)} title="Member Details" size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={()=>{ openEdit(viewUser!); setViewUser(null); }}><Edit2 size={15}/> Edit</button>
          <button className="btn btn-primary" onClick={()=>setViewUser(null)}>Close</button>
        </>}
      >
        {viewUser && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:56,height:56,borderRadius:'99px',background:'linear-gradient(135deg,var(--blue) 0%,var(--teal) 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'1.1rem',fontWeight:700,flexShrink:0 }}>
                {viewUser.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div>
                <h3 style={{ fontSize:'1.1rem' }}>{viewUser.name}</h3>
                <div style={{ display:'flex', gap:8, marginTop:4 }}>
                  <span className={`badge ${roleColor[viewUser.role] ?? 'badge-neutral'}`}>{viewUser.role}</span>
                  <span className={`badge ${viewUser.isActive ? 'badge-success' : 'badge-neutral'}`}>{viewUser.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { icon:<Mail size={13}/>, label:'Email', value: viewUser.email },
                { icon:<Hash size={13}/>, label:'Membership ID', value: viewUser.membershipId ?? '—' },
                { icon:<Phone size={13}/>, label:'Phone', value: viewUser.phone ?? '—' },
                { icon:<ShieldOff size={13}/>, label:'Joined', value: fmtDate(viewUser.createdAt) },
              ].map(f=>(
                <div key={f.label}>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600, display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>{f.icon} {f.label}</div>
                  <div style={{ fontSize:'0.9rem', fontWeight:500 }}>{f.value}</div>
                </div>
              ))}
            </div>
            {viewBorrows.length > 0 && (
              <div style={{ marginTop:20 }}>
                <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:10, color:'var(--text-secondary)' }}>Recent Borrows</div>
                {viewBorrows.slice(0,4).map(b=>(
                  <div key={b._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--surface-2)' }}>
                    <span className={`badge ${b.status==='borrowed'?'badge-teal':b.status==='overdue'?'badge-danger':'badge-neutral'}`} style={{ minWidth:72, justifyContent:'center' }}>{b.status}</span>
                    <div style={{ fontSize:'0.88rem', flex:1 }}>{typeof b.book === 'object' ? b.book.title : '—'}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{fmtDate(b.dueDate)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={showAdd || !!editUser} onClose={()=>{setShowAdd(false);setEditUser(null);}}
        title={editUser ? 'Edit Member' : 'Add Member'} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={()=>{setShowAdd(false);setEditUser(null);}}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={15} className="spin"/> Saving…</> : editUser ? 'Save Changes' : 'Add Member'}
          </button>
        </>}
      >
        <UserForm />
      </Modal>

      {/* Deactivate confirm */}
      <Modal open={!!deactUser} onClose={()=>setDeactUser(null)} title={deactUser?.isActive ? 'Deactivate Member' : 'Activate Member'} size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={()=>setDeactUser(null)}>Cancel</button>
          <button className={`btn ${deactUser?.isActive ? 'btn-danger' : 'btn-success'}`} onClick={handleDeactivate}>
            {deactUser?.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </>}
      >
        <p>{deactUser?.isActive ? 'Deactivating' : 'Activating'} <strong>{deactUser?.name}</strong> will {deactUser?.isActive ? 'prevent them from borrowing books' : 'restore their borrowing access'}.</p>
      </Modal>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}.spin{animation:spin 0.9s linear infinite;}`}</style>
    </div>
  );
}
