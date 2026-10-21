import { useState, useEffect, useCallback } from 'react';
import { BookMarked, BookOpen, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { getMyBorrows } from '../api/borrowsApi';
import type { Borrow } from '../types';

type Tab = 'active' | 'all';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

const getDaysLeft = (dueDate: string) => {
  const due   = new Date(dueDate);
  const today = new Date();
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
};

export default function MyBorrows() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyBorrows();
      setBorrows(res.data.data ?? []);
    } catch {/* */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active   = borrows.filter(b => b.status === 'borrowed' || b.status === 'overdue');
  const displayed = tab === 'active' ? active : borrows;

  const overdue  = borrows.filter(b => b.status === 'overdue').length;
  const returned = borrows.filter(b => b.status === 'returned').length;
  const unpaidFines = borrows.reduce((s, b) => !b.fine.paid ? s + (b.fine.amount ?? 0) : s, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Borrows</h1>
          <p className="page-subtitle">Track your borrowed books and return dates</p>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Currently Borrowed', value: active.length,   icon:<BookOpen size={18}/>,      color:'stat-blue' },
          { label:'Overdue',            value: overdue,          icon:<AlertTriangle size={18}/>,  color:'stat-danger' },
          { label:'Returned',           value: returned,         icon:<CheckCircle size={18}/>,    color:'stat-emerald' },
          { label:'Unpaid Fines',       value:`$${unpaidFines.toFixed(2)}`, icon:<Clock size={18}/>, color:'stat-warning' },
        ].map(s=>(
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18, borderBottom:'1px solid var(--border)', paddingBottom:1 }}>
        {([
          { key:'active', label:'Active', count: active.length },
          { key:'all',    label:'All History' },
        ] as const).map(t => (
          <button key={t.key}
            onClick={()=>setTab(t.key)}
            style={{
              padding:'9px 18px', background:'none', border:'none', cursor:'pointer',
              fontFamily:'inherit', fontSize:'0.9rem', fontWeight:600,
              color: tab===t.key ? 'var(--blue)' : 'var(--text-secondary)',
              borderBottom: tab===t.key ? '2px solid var(--blue)' : '2px solid transparent',
              marginBottom:-1, display:'flex', alignItems:'center', gap:7,
            }}
          >
            {t.label}
            {'count' in t && t.count > 0 && (
              <span style={{ background:'var(--blue-50)', color:'var(--blue)', fontSize:'0.72rem', fontWeight:700, padding:'1px 7px', borderRadius:'99px' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading
        ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:64, gap:10, color:'var(--text-muted)' }}>
            <Loader2 size={20} style={{ animation:'spin 0.9s linear infinite' }} /> Loading…
          </div>
        : displayed.length === 0
          ? <div className="empty-state">
              <div className="empty-state-icon"><BookMarked size={28}/></div>
              <h3>{tab==='active' ? 'No active borrows' : 'No borrowing history'}</h3>
              <p>{tab==='active' ? 'You have no books currently on loan.' : 'You have not borrowed any books yet.'}</p>
            </div>
          : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {displayed.map(b => {
                const bk       = typeof b.book === 'object' ? b.book : null;
                const daysLeft = b.status !== 'returned' ? getDaysLeft(b.dueDate) : null;
                const isOverdue = b.status === 'overdue';

                return (
                  <div key={b._id} className="card" style={{ padding:'18px 22px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                      {/* Book icon */}
                      <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background: isOverdue?'var(--danger-bg)':'var(--blue-50)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0, color: isOverdue?'var(--danger)':'var(--blue)' }}>
                        {isOverdue ? <AlertTriangle size={20}/> : <BookOpen size={20}/>}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:'1rem' }}>{bk?.title ?? '—'}</div>
                            <div style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:2 }}>{bk?.author}</div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                            <span className={`badge ${b.status==='borrowed'?'badge-teal':b.status==='overdue'?'badge-danger':'badge-neutral'}`}>
                              {b.status}
                            </span>
                            {daysLeft !== null && (
                              <span className={`due-pill ${daysLeft<0?'due-overdue':daysLeft<=3?'due-soon':'due-ok'}`}>
                                {daysLeft < 0
                                  ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft)!==1?'s':''} overdue`
                                  : daysLeft === 0
                                    ? 'Due today'
                                    : `${daysLeft} day${daysLeft!==1?'s':''} left`
                                }
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display:'flex', gap:24, marginTop:12, fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                          <div><span style={{ color:'var(--text-muted)', fontWeight:600 }}>Borrowed:</span> {fmtDate(b.borrowDate)}</div>
                          <div><span style={{ color:'var(--text-muted)', fontWeight:600 }}>Due:</span> {fmtDate(b.dueDate)}</div>
                          {b.returnDate && <div><span style={{ color:'var(--text-muted)', fontWeight:600 }}>Returned:</span> {fmtDate(b.returnDate)}</div>}
                        </div>

                        {(b.fine?.amount ?? 0) > 0 && (
                          <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:6, padding:'5px 10px', background: b.fine.paid?'var(--emerald-50)':'var(--danger-bg)', borderRadius:'var(--r)', fontSize:'0.82rem', fontWeight:600, color: b.fine.paid?'var(--emerald)':'var(--danger)', border:`1px solid ${b.fine.paid?'var(--emerald-100)':'var(--danger-border)'}` }}>
                            {b.fine.paid ? <CheckCircle size={13}/> : <AlertTriangle size={13}/>}
                            Fine: ${(b.fine.amount ?? 0).toFixed(2)} {b.fine.paid ? '— Paid' : '— Outstanding (pay at the library)'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
      }
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
