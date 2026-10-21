import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, RefreshCw, AlertTriangle, DollarSign,
  TrendingUp, ArrowRight, Plus, Clock, CheckCircle, BookMarked,
  Activity, BarChart2, ArrowUpRight, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../api/usersApi';
import { getBorrows } from '../api/borrowsApi';
import { getBooks } from '../api/booksApi';
import BarChart from '../components/charts/BarChart';
import AreaChart from '../components/charts/AreaChart';
import type { Borrow, Book } from '../types';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Generate mock weekly data from borrows
const buildWeeklyData = (borrows: Borrow[]) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  borrows.forEach(b => {
    const d = new Date(b.borrowDate);
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff < 7) {
      const idx = (new Date(b.borrowDate).getDay() + 6) % 7;
      counts[idx]++;
    }
  });
  return days.map((label, i) => ({ label, value: counts[i] }));
};

const buildMonthlyData = (borrows: Borrow[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const counts = new Array(12).fill(0);
  borrows.forEach(b => { counts[new Date(b.borrowDate).getMonth()]++; });
  const cur = new Date().getMonth();
  const labels: string[] = [];
  const vals: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const idx = (cur - i + 12) % 12;
    labels.push(months[idx]);
    vals.push(counts[idx]);
  }
  return labels.map((label, i) => ({ label, value: vals[i] }));
};

export default function Dashboard() {
  const { user, canManage } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [books, setBooks]   = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [sRes, bRes, bkRes] = await Promise.all([
        canManage ? getDashboardStats() : Promise.resolve(null),
        getBorrows({ limit: 50 }),
        getBooks({ limit: 12 }),
      ]);
      if (sRes) {
        const d = sRes.data.data ?? (sRes.data as unknown as Record<string, number>);
        setStats(d as Record<string, number>);
      }
      setBorrows((bRes.data.data ?? []) as Borrow[]);
      setBooks((bkRes.data.data ?? []) as Book[]);
    } catch {/* handled below */} finally { setLoading(false); }
  }, [canManage]);

  useEffect(() => { load(); }, [load]);

  // ---------- Member view ----------
  if (!canManage) {
    const myBorrows = borrows.filter(b => {
      const m = b.member;
      const id = typeof m === 'string' ? m : m?._id;
      return id === user?._id;
    });
    const active = myBorrows.filter(b => b.status === 'borrowed');
    const overdue = myBorrows.filter(b => b.status === 'overdue');

    return (
      <div>
        {/* Hero */}
        <div className="hero-banner">
          <div className="hero-greeting">{greeting()},</div>
          <div className="hero-name">{user?.name} 👋</div>
          <div className="hero-sub">
            You have <strong>{active.length}</strong> book{active.length !== 1 ? 's' : ''} on loan
            {overdue.length > 0 && <>, and <strong style={{ color: '#fca5a5' }}>{overdue.length} overdue</strong></>}.
          </div>
          <div className="hero-actions">
            <Link to="/books" className="hero-action-btn">
              <BookOpen size={15} /> Browse Books
            </Link>
            <Link to="/my-borrows" className="hero-action-btn">
              <BookMarked size={15} /> My Borrows
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Books Borrowed', value: myBorrows.length, icon: <BookOpen size={18} />, color: 'stat-blue' },
            { label: 'Currently Active', value: active.length, icon: <RefreshCw size={18} />, color: 'stat-teal' },
            { label: 'Overdue', value: overdue.length, icon: <AlertTriangle size={18} />, color: 'stat-danger' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Quick Actions</div>
                <div className="card-subtitle">What would you like to do?</div>
              </div>
            </div>
            <div className="card-body">
              <div className="quick-actions">
                {[
                  { to: '/books', icon: <BookOpen size={20} />, cls: 'blue', title: 'Browse Catalogue', desc: 'Search and discover books' },
                  { to: '/my-borrows', icon: <BookMarked size={20} />, cls: 'teal', title: 'My Borrows', desc: 'View your current loans' },
                  { to: '/books?available=true', icon: <CheckCircle size={20} />, cls: 'emerald', title: 'Available Now', desc: 'Books ready to borrow' },
                  { to: '/my-borrows', icon: <Clock size={20} />, cls: 'warning', title: 'Due Soon', desc: 'Check return dates' },
                ].map(a => (
                  <Link key={a.to} to={a.to} className="quick-action-card">
                    <div className={`quick-action-icon ${a.cls}`}>{a.icon}</div>
                    <div>
                      <div className="quick-action-title">{a.title}</div>
                      <div className="quick-action-desc">{a.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Active Borrows</div>
              <Link to="/my-borrows" style={{ fontSize: '0.82rem', color: 'var(--blue)', display:'flex',alignItems:'center',gap:4 }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="card-body" style={{ padding: '12px 22px 20px' }}>
              {active.length === 0
                ? <div className="empty-state" style={{ padding: '32px 0' }}>
                    <p>No active borrows</p>
                  </div>
                : active.slice(0, 5).map(b => {
                    const bk = b.book as { title?: string };
                    const due = new Date(b.dueDate);
                    const today = new Date();
                    const daysLeft = Math.ceil((due.getTime() - today.getTime()) / 86400000);
                    return (
                      <div key={b._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--surface-2)' }}>
                        <div style={{ width:36,height:36,background:'var(--blue-50)',borderRadius:'var(--r)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--blue)',flexShrink:0 }}>
                          <BookOpen size={15} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'0.9rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {typeof bk === 'object' ? bk.title : 'Unknown'}
                          </div>
                          <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Due {fmtDate(b.dueDate)}</div>
                        </div>
                        <span className={`due-pill ${daysLeft < 0 ? 'due-overdue' : daysLeft <= 3 ? 'due-soon' : 'due-ok'}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d late` : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                        </span>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Admin / Librarian view ----------
  const statCards = [
    { label: 'Total Books',     value: stats.totalBooks ?? books.length,   icon: <BookOpen size={18} />,     color: 'stat-blue' },
    { label: 'Active Members',  value: stats.totalMembers ?? 0,            icon: <Users size={18} />,        color: 'stat-navy' },
    { label: 'Books Issued',    value: stats.issuedBooks ?? borrows.filter(b=>b.status==='borrowed').length, icon: <RefreshCw size={18} />, color: 'stat-teal' },
    { label: 'Overdue',         value: stats.overdueBooks ?? borrows.filter(b=>b.status==='overdue').length, icon: <AlertTriangle size={18} />, color: 'stat-warning' },
    { label: 'Fines Collected', value: stats.collectedFines ?? 0,          icon: <DollarSign size={18} />,   color: 'stat-emerald' },
  ];

  const weeklyData   = buildWeeklyData(borrows);
  const monthlyData  = buildMonthlyData(borrows);
  const recentBorrows = [...borrows].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 6);

  const topBooks = books.slice(0, 5).map(bk => ({
    title: bk.title,
    author: bk.author,
    available: bk.availableCopies,
    total: bk.totalCopies,
  }));

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400, flexDirection:'column', gap:12, color:'var(--text-muted)' }}>
        <Loader2 size={28} style={{ animation:'spin 0.9s linear infinite' }} />
        <span>Loading dashboard…</span>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="hero-banner">
        <div className="hero-greeting">{greeting()},</div>
        <div className="hero-name">{user?.name}</div>
        <div className="hero-sub">
          Here's what's happening in your library today.
        </div>
        <div className="hero-actions">
          <Link to="/circulation" className="hero-action-btn">
            <Plus size={15} /> Issue Book
          </Link>
          <Link to="/members" className="hero-action-btn">
            <Users size={15} /> Members
          </Link>
          <Link to="/penalties" className="hero-action-btn">
            <AlertTriangle size={15} /> Penalties
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-value">{Number(s.value).toLocaleString()}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        <div className="dashboard-main">
          {/* Charts */}
          <div className="charts-row">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <BarChart2 size={16} style={{ color:'var(--blue)' }} /> Weekly Activity
                  </div>
                  <div className="card-subtitle">Borrowing activity this week</div>
                </div>
              </div>
              <div className="card-body" style={{ paddingTop: 12 }}>
                <BarChart data={weeklyData} height={180} color="var(--blue)" label="Borrows" />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <TrendingUp size={16} style={{ color:'var(--teal)' }} /> Monthly Trend
                  </div>
                  <div className="card-subtitle">Borrows over last 6 months</div>
                </div>
              </div>
              <div className="card-body" style={{ paddingTop: 12 }}>
                <AreaChart data={monthlyData} height={180} color="var(--teal)" />
              </div>
            </div>
          </div>

          {/* Recent borrows table */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header" style={{ paddingBottom: 14 }}>
              <div>
                <div className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Activity size={16} style={{ color:'var(--blue)' }} /> Recent Transactions
                </div>
                <div className="card-subtitle">Latest borrowing activity</div>
              </div>
              <Link to="/circulation" style={{ fontSize:'0.82rem', color:'var(--blue)', display:'flex', alignItems:'center', gap:4 }}>
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="table-wrap" style={{ border:'none', boxShadow:'none', borderRadius:0, borderTop:'1px solid var(--border)' }}>
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Issued</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBorrows.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>No recent transactions</td></tr>
                    : recentBorrows.map(b => {
                        const bk = typeof b.book === 'object' ? b.book : null;
                        const mem = typeof b.member === 'object' ? b.member : null;
                        const statusClass = b.status === 'borrowed' ? 'badge-teal' : b.status === 'overdue' ? 'badge-danger' : 'badge-neutral';
                        return (
                          <tr key={b._id}>
                            <td>
                              <span style={{ fontWeight:600 }}>{bk?.title ?? '—'}</span>
                              {bk?.author && <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{bk.author}</div>}
                            </td>
                            <td style={{ color:'var(--text-secondary)' }}>{mem?.name ?? '—'}</td>
                            <td style={{ color:'var(--text-secondary)', fontSize:'0.88rem' }}>{fmtDate(b.borrowDate)}</td>
                            <td style={{ fontSize:'0.88rem' }}>{fmtDate(b.dueDate)}</td>
                            <td><span className={`badge ${statusClass}`}>{b.status}</span></td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Quick actions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>
            <div className="card-body">
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { to:'/books',        icon:<Plus size={15}/>,         label:'Add New Book',     cls:'blue' },
                  { to:'/members',      icon:<Users size={15}/>,        label:'Manage Members',   cls:'teal' },
                  { to:'/circulation',  icon:<RefreshCw size={15}/>,    label:'Issue / Return',   cls:'emerald' },
                  { to:'/penalties',    icon:<DollarSign size={15}/>,   label:'Collect Fines',    cls:'warning' },
                ].map(a => (
                  <Link key={a.to} to={a.to}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:'var(--r)', border:'1.5px solid var(--border)', textDecoration:'none', color:'var(--text-primary)', fontSize:'0.88rem', fontWeight:600, transition:'all var(--t-fast)' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--blue)';(e.currentTarget as HTMLAnchorElement).style.background='var(--blue-50)';}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border)';(e.currentTarget as HTMLAnchorElement).style.background='var(--white)';}}
                  >
                    <div className={`quick-action-icon ${a.cls}`} style={{ width:30,height:30,minWidth:30 }}>{a.icon}</div>
                    {a.label}
                    <ArrowUpRight size={13} style={{ marginLeft:'auto', color:'var(--text-muted)' }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Top books */}
          <div className="card" style={{ flex:1 }}>
            <div className="card-header">
              <div className="card-title">Book Availability</div>
              <Link to="/books" style={{ fontSize:'0.82rem', color:'var(--blue)', display:'flex', alignItems:'center', gap:4 }}>
                All <ArrowRight size={13} />
              </Link>
            </div>
            <div className="card-body" style={{ padding:'10px 22px 20px' }}>
              {topBooks.map((bk, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom: i<topBooks.length-1?'1px solid var(--surface-2)':'none' }}>
                  <div style={{ width:32,height:32,background:'var(--surface-2)',borderRadius:'var(--r)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)',flexShrink:0 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.875rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bk.title}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{bk.author}</div>
                  </div>
                  <span className={`badge ${bk.available > 0 ? 'badge-teal' : 'badge-danger'}`} style={{ fontSize:'0.72rem' }}>
                    {bk.available}/{bk.total}
                  </span>
                </div>
              ))}
              {topBooks.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'24px 0', fontSize:'0.88rem' }}>No books yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
