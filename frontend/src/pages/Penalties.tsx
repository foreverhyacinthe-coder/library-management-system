import { useState, useEffect, useCallback } from 'react';
import { DollarSign, AlertTriangle, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import { getBorrows, payFine } from '../api/borrowsApi';
import { useToast } from '../context/ToastContext';
import type { Borrow } from '../types';

type Tab = 'unpaid' | 'all';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

export default function Penalties() {
  const { showToast } = useToast();
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('unpaid');
  const [paying, setPaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBorrows({ limit: 100 });
      setBorrows((res.data.data ?? []).filter((b: Borrow) => b.fine > 0));
    } catch { showToast('error', 'Failed to load penalty records.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unpaid   = borrows.filter(b => !b.finePaid);
  const all      = borrows;
  const displayed = tab === 'unpaid' ? unpaid : all;

  const totalUnpaid   = unpaid.reduce((s, b) => s + b.fine, 0);
  const totalCollected = borrows.filter(b=>b.finePaid).reduce((s,b)=>s+b.fine,0);
  const totalFines    = borrows.reduce((s,b)=>s+b.fine,0);

  const handlePay = async (b: Borrow) => {
    setPaying(b._id);
    try {
      await payFine(b._id);
      showToast('success', `$${b.fine.toFixed(2)} fine collected.`);
      load();
    } catch { showToast('error', 'Payment failed.'); }
    finally { setPaying(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Penalties &amp; Fines</h1>
          <p className="page-subtitle">Manage overdue fines and payment collection</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label:'Total Outstanding', value:`$${totalUnpaid.toFixed(2)}`,   icon:<AlertTriangle size={18}/>, color:'stat-danger' },
          { label:'Total Collected',   value:`$${totalCollected.toFixed(2)}`, icon:<CheckCircle size={18}/>,  color:'stat-emerald' },
          { label:'Total Fines',       value:`$${totalFines.toFixed(2)}`,     icon:<DollarSign size={18}/>,   color:'stat-blue' },
          { label:'Unpaid Records',    value: unpaid.length,                  icon:<TrendingUp size={18}/>,   color:'stat-warning' },
        ].map(s => (
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
          { key:'unpaid', label:'Unpaid', count: unpaid.length },
          { key:'all',    label:'All Records' },
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
              <span style={{ background:'var(--danger-bg)', color:'var(--danger)', fontSize:'0.72rem', fontWeight:700, padding:'1px 7px', borderRadius:'99px' }}>
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
          : displayed.length === 0
            ? <div className="empty-state">
                <div className="empty-state-icon"><CheckCircle size={28} style={{ color:'var(--emerald)' }} /></div>
                <h3>{tab === 'unpaid' ? 'No outstanding fines' : 'No fine records'}</h3>
                <p>{tab === 'unpaid' ? 'All fines have been collected.' : 'No fines have been issued yet.'}</p>
              </div>
            : <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Book</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Fine Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(b => {
                    const mem = typeof b.member === 'object' ? b.member : null;
                    const bk  = typeof b.book   === 'object' ? b.book   : null;
                    return (
                      <tr key={b._id}>
                        <td>
                          <div style={{ fontWeight:600 }}>{mem?.name ?? '—'}</div>
                          {mem?.membershipId && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{mem.membershipId}</div>}
                        </td>
                        <td>
                          <div>{bk?.title ?? '—'}</div>
                          {bk?.author && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{bk.author}</div>}
                        </td>
                        <td style={{ fontSize:'0.88rem', color:'var(--danger)', fontWeight:500 }}>{fmtDate(b.dueDate)}</td>
                        <td style={{ fontSize:'0.88rem', color:'var(--text-secondary)' }}>{b.returnDate ? fmtDate(b.returnDate) : '—'}</td>
                        <td>
                          <span style={{ fontWeight:700, fontSize:'1rem', color: b.finePaid ? 'var(--success)' : 'var(--danger)' }}>
                            ${b.fine.toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${b.finePaid ? 'badge-success' : 'badge-danger'}`}>
                            {b.finePaid ? <><CheckCircle size={10} /> Paid</> : <><AlertTriangle size={10} /> Unpaid</>}
                          </span>
                        </td>
                        <td>
                          {!b.finePaid && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={()=>handlePay(b)}
                              disabled={paying === b._id}
                            >
                              {paying===b._id
                                ? <><Loader2 size={13} className="spin"/> Processing…</>
                                : <><DollarSign size={13}/> Collect</>
                              }
                            </button>
                          )}
                          {b.finePaid && (
                            <span style={{ fontSize:'0.82rem', color:'var(--success)', fontWeight:500 }}>Collected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
        }
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}.spin{animation:spin 0.9s linear infinite;}`}</style>
    </div>
  );
}
