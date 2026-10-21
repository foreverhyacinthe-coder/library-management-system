import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw, Search, ArrowDownLeft, ArrowUpRight, DollarSign,
  BookOpen, User, Loader2, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { getBorrows, issueBorrow, returnBorrow, payFine } from '../api/borrowsApi';
import { getBooks } from '../api/booksApi';
import { getUsers } from '../api/usersApi';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import type { Borrow, Book, User as UserType } from '../types';

type Tab = 'all' | 'borrowed' | 'overdue' | 'returned';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

export default function Circulation() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('all');
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue form
  const [showIssue, setShowIssue] = useState(false);
  const [issueBook, setIssueBook] = useState<Book | null>(null);
  const [issueMember, setIssueMember] = useState<UserType | null>(null);
  const [bookQuery, setBookQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [bookResults, setBookResults] = useState<Book[]>([]);
  const [memberResults, setMemberResults] = useState<UserType[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Return form
  const [returnBorrowId, setReturnBorrowId] = useState<Borrow | null>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [returning, setReturning] = useState(false);

  const bookTimer = useRef<ReturnType<typeof setTimeout>>();
  const memberTimer = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBorrows({ status: tab === 'all' ? undefined : tab, limit: 50 });
      setBorrows(res.data.data ?? []);
    } catch { showToast('error', 'Failed to load borrows.'); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  // Debounced book search
  useEffect(() => {
    clearTimeout(bookTimer.current);
    if (!bookQuery.trim()) { setBookResults([]); return; }
    bookTimer.current = setTimeout(async () => {
      const res = await getBooks({ search: bookQuery, available: true });
      setBookResults((res.data.data ?? []).slice(0, 6));
    }, 300);
  }, [bookQuery]);

  // Debounced member search
  useEffect(() => {
    clearTimeout(memberTimer.current);
    if (!memberQuery.trim()) { setMemberResults([]); return; }
    memberTimer.current = setTimeout(async () => {
      const res = await getUsers({ search: memberQuery, role: 'member' });
      setMemberResults((res.data.data ?? []).slice(0, 6));
    }, 300);
  }, [memberQuery]);

  const handleIssue = async () => {
    if (!issueBook || !issueMember) { showToast('error', 'Select a book and member.'); return; }
    setIssuing(true);
    try {
      await issueBorrow(issueBook._id, issueMember._id, dueDate || undefined);
      showToast('success', `"${issueBook.title}" issued to ${issueMember.name}.`);
      setShowIssue(false); setIssueBook(null); setIssueMember(null); setBookQuery(''); setMemberQuery(''); setDueDate('');
      load();
    } catch (e: unknown) {
      showToast('error', (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Issue failed.');
    } finally { setIssuing(false); }
  };

  const handleReturn = async () => {
    if (!returnBorrowId) return;
    setReturning(true);
    try {
      await returnBorrow(returnBorrowId._id, returnNotes);
      showToast('success', 'Book returned successfully.');
      setReturnBorrowId(null); setReturnNotes('');
      load();
    } catch { showToast('error', 'Return failed.'); }
    finally { setReturning(false); }
  };

  const handlePayFine = async (b: Borrow) => {
    try {
      await payFine(b._id);
      showToast('success', `Fine of $${b.fine.toFixed(2)} collected.`);
      load();
    } catch { showToast('error', 'Payment failed.'); }
  };

  const tabDef: { key: Tab; label: string; count?: number }[] = [
    { key:'all',       label:'All' },
    { key:'borrowed',  label:'Borrowed',  count: borrows.filter(b=>b.status==='borrowed').length },
    { key:'overdue',   label:'Overdue',   count: borrows.filter(b=>b.status==='overdue').length },
    { key:'returned',  label:'Returned' },
  ];

  const defaultDue = () => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const openIssue = () => { setDueDate(defaultDue()); setShowIssue(true); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Circulation</h1>
          <p className="page-subtitle">Issue books, process returns, and manage fines</p>
        </div>
        <button className="btn btn-primary" onClick={openIssue}>
          <ArrowUpRight size={16} /> Issue Book
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18, borderBottom:'1px solid var(--border)', paddingBottom:1 }}>
        {tabDef.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding:'9px 18px', background:'none', border:'none', cursor:'pointer',
              fontFamily:'inherit', fontSize:'0.9rem', fontWeight:600,
              color: tab===t.key ? 'var(--blue)' : 'var(--text-secondary)',
              borderBottom: tab===t.key ? '2px solid var(--blue)' : '2px solid transparent',
              marginBottom:-1, display:'flex', alignItems:'center', gap:7, transition:'color 0.15s',
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span style={{ background: t.key==='overdue' ? 'var(--danger-bg)' : 'var(--blue-50)', color: t.key==='overdue' ? 'var(--danger)' : 'var(--blue)', fontSize:'0.72rem', fontWeight:700, padding:'1px 7px', borderRadius:'99px' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading
          ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48, gap:10, color:'var(--text-muted)' }}>
              <Loader2 size={20} style={{ animation:'spin 0.9s linear infinite' }} /> Loading…
            </div>
          : borrows.length === 0
            ? <div className="empty-state">
                <div className="empty-state-icon"><RefreshCw size={28} /></div>
                <h3>No records found</h3>
                <p>No borrowing activity matches this view.</p>
                <button className="btn btn-primary" onClick={openIssue}><ArrowUpRight size={15} /> Issue a Book</button>
              </div>
            : <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Issued</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {borrows.map(b => {
                    const bk = typeof b.book === 'object' ? b.book : null;
                    const mem = typeof b.member === 'object' ? b.member : null;
                    const isOverdue = b.status === 'overdue';
                    const isBorrowed = b.status === 'borrowed';

                    return (
                      <tr key={b._id}>
                        <td>
                          <div style={{ fontWeight:600 }}>{bk?.title ?? '—'}</div>
                          {bk?.author && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{bk.author}</div>}
                        </td>
                        <td>
                          <div style={{ fontWeight:500 }}>{mem?.name ?? '—'}</div>
                          {mem?.membershipId && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{mem.membershipId}</div>}
                        </td>
                        <td style={{ fontSize:'0.88rem', color:'var(--text-secondary)' }}>{fmtDate(b.borrowDate)}</td>
                        <td style={{ fontSize:'0.88rem' }}>
                          <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                            {fmtDate(b.dueDate)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${b.status==='borrowed' ? 'badge-teal' : b.status==='overdue' ? 'badge-danger' : 'badge-neutral'}`}>
                            {b.status==='overdue' && <AlertTriangle size={10} />}
                            {b.status==='returned' && <CheckCircle size={10} />}
                            {b.status}
                          </span>
                        </td>
                        <td>
                          {b.fine > 0
                            ? <span style={{ fontWeight:600, color: b.finePaid ? 'var(--success)' : 'var(--danger)' }}>
                                ${b.fine.toFixed(2)} {b.finePaid ? '✓' : ''}
                              </span>
                            : <span style={{ color:'var(--text-muted)' }}>—</span>
                          }
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:5 }}>
                            {(isBorrowed || isOverdue) && (
                              <button className="btn btn-sm btn-secondary" onClick={()=>setReturnBorrowId(b)}>
                                <ArrowDownLeft size={13} /> Return
                              </button>
                            )}
                            {b.fine > 0 && !b.finePaid && (
                              <button className="btn btn-sm btn-success" onClick={()=>handlePayFine(b)}>
                                <DollarSign size={13} /> Pay
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
        }
      </div>

      {/* Issue Modal */}
      <Modal open={showIssue} onClose={()=>setShowIssue(false)} title="Issue Book" size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={()=>setShowIssue(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleIssue} disabled={issuing || !issueBook || !issueMember}>
            {issuing ? <><Loader2 size={15} className="spin" /> Issuing…</> : <><ArrowUpRight size={15}/> Issue Book</>}
          </button>
        </>}
      >
        {/* Book search */}
        <div className="form-group">
          <label className="form-label">Search Book</label>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}><Search size={15} /></div>
            <input className="form-input" style={{ paddingLeft:38 }} placeholder="Type book title or author…"
              value={issueBook ? issueBook.title : bookQuery}
              onChange={e=>{ setBookQuery(e.target.value); setIssueBook(null); }}
              onFocus={()=>{ if (issueBook) { setBookQuery(issueBook.title); setIssueBook(null); } }}
            />
          </div>
          {bookResults.length > 0 && !issueBook && (
            <div style={{ border:'1.5px solid var(--border)', borderRadius:'var(--r)', marginTop:4, overflow:'hidden', boxShadow:'var(--shadow)' }}>
              {bookResults.map(bk=>(
                <div key={bk._id}
                  onClick={()=>{ setIssueBook(bk); setBookResults([]); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--surface-2)' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--blue-50)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='var(--white)')}
                >
                  <BookOpen size={15} style={{ color:'var(--blue)', flexShrink:0 }} />
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{bk.title}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{bk.author} · {bk.availableCopies} available</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {issueBook && (
            <div style={{ marginTop:8, background:'var(--teal-50)', border:'1px solid var(--teal-100)', borderRadius:'var(--r)', padding:'8px 12px', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:8, color:'var(--teal)' }}>
              <CheckCircle size={14} /> <strong>{issueBook.title}</strong> selected · {issueBook.availableCopies} copies available
            </div>
          )}
        </div>

        {/* Member search */}
        <div className="form-group">
          <label className="form-label">Search Member</label>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}><User size={15} /></div>
            <input className="form-input" style={{ paddingLeft:38 }} placeholder="Type member name or email…"
              value={issueMember ? issueMember.name : memberQuery}
              onChange={e=>{ setMemberQuery(e.target.value); setIssueMember(null); }}
              onFocus={()=>{ if (issueMember) { setMemberQuery(issueMember.name); setIssueMember(null); } }}
            />
          </div>
          {memberResults.length > 0 && !issueMember && (
            <div style={{ border:'1.5px solid var(--border)', borderRadius:'var(--r)', marginTop:4, overflow:'hidden', boxShadow:'var(--shadow)' }}>
              {memberResults.map(m=>(
                <div key={m._id}
                  onClick={()=>{ setIssueMember(m); setMemberResults([]); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--surface-2)' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--blue-50)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='var(--white)')}
                >
                  <div style={{ width:28,height:28,background:'var(--blue)',borderRadius:'99px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.72rem',fontWeight:700,flexShrink:0 }}>
                    {m.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{m.name}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{m.email} · {m.membershipId}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {issueMember && (
            <div style={{ marginTop:8, background:'var(--teal-50)', border:'1px solid var(--teal-100)', borderRadius:'var(--r)', padding:'8px 12px', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:8, color:'var(--teal)' }}>
              <CheckCircle size={14} /> <strong>{issueMember.name}</strong> selected · {issueMember.membershipId}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input className="form-input" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal open={!!returnBorrowId} onClose={()=>setReturnBorrowId(null)} title="Return Book"
        footer={<>
          <button className="btn btn-secondary" onClick={()=>setReturnBorrowId(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleReturn} disabled={returning}>
            {returning ? <><Loader2 size={15} className="spin" /> Processing…</> : <><ArrowDownLeft size={15}/> Confirm Return</>}
          </button>
        </>}
      >
        {returnBorrowId && (
          <>
            {returnBorrowId.status === 'overdue' && (
              <div style={{ background:'var(--danger-bg)', border:'1px solid var(--danger-border)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:16, display:'flex', gap:10, alignItems:'flex-start' }}>
                <AlertTriangle size={16} style={{ color:'var(--danger)', marginTop:2, flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:700, color:'var(--danger)', fontSize:'0.9rem' }}>This book is overdue</div>
                  <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:2 }}>
                    A fine of <strong>${returnBorrowId.fine.toFixed(2)}</strong> will be applied.
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginBottom:16, background:'var(--surface)', borderRadius:'var(--r)', padding:'12px 14px', fontSize:'0.88rem' }}>
              <div><strong>{typeof returnBorrowId.book === 'object' ? returnBorrowId.book.title : '—'}</strong></div>
              <div style={{ color:'var(--text-muted)', marginTop:2 }}>Borrowed by {typeof returnBorrowId.member === 'object' ? returnBorrowId.member.name : '—'}</div>
              <div style={{ color:'var(--text-muted)', marginTop:2 }}>Due: {fmtDate(returnBorrowId.dueDate)}</div>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" placeholder="Condition notes, damage, etc…" value={returnNotes} onChange={e=>setReturnNotes(e.target.value)} style={{ minHeight:70 }} />
            </div>
          </>
        )}
      </Modal>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}.spin{animation:spin 0.9s linear infinite;}`}</style>
    </div>
  );
}
