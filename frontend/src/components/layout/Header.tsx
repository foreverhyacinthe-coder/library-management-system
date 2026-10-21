import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Bell, Settings, ChevronDown, LogOut, User,
  BookOpen, AlertTriangle, CheckCircle, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Mock notification data ───────────────────────────────────────────────────
const MOCK_NOTIFS = [
  { id: '1', type: 'overdue',  title: 'Overdue book',       body: '"Things Fall Apart" is 3 days overdue.', time: '2h ago',  read: false },
  { id: '2', type: 'return',   title: 'Book returned',      body: '"Atomic Habits" has been returned.',    time: '5h ago',  read: false },
  { id: '3', type: 'issue',    title: 'New issue',          body: '"Sapiens" issued to Alice Kamau.',      time: '1d ago',  read: true  },
  { id: '4', type: 'overdue',  title: 'Overdue reminder',   body: '"Clean Code" is 1 day overdue.',       time: '2d ago',  read: true  },
];

const notifIcon = (type: string) => {
  if (type === 'overdue') return <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />;
  if (type === 'return')  return <CheckCircle   size={14} style={{ color: 'var(--emerald)' }} />;
  return <BookOpen size={14} style={{ color: 'var(--blue)' }} />;
};

// ─── Click-outside hook ───────────────────────────────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery]           = useState('');
  const [notifOpen, setNotifOpen]   = useState(false);
  const [userOpen, setUserOpen]     = useState(false);
  const [notifs, setNotifs]         = useState(MOCK_NOTIFS);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(userRef,  () => setUserOpen(false));

  const unread = notifs.filter(n => !n.read).length;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/books?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const dismiss = (id: string) => setNotifs(n => n.filter(x => x.id !== id));

  const handleLogout = () => {
    setUserOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <form className="header-search" onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              className="search-input"
              type="text"
              placeholder="Search books, members…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="header-right">

        {/* ── Notifications ── */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="header-icon-btn"
            title="Notifications"
            onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
          >
            <Bell size={18} />
            {unread > 0 && <span className="notif-badge">{unread}</span>}
          </button>

          {notifOpen && (
            <div className="dropdown notif-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-title">Notifications</span>
                {unread > 0 && (
                  <button className="dropdown-action-btn" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifs.length === 0
                  ? <div className="notif-empty">No notifications</div>
                  : notifs.map(n => (
                    <div key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}>
                      <div className="notif-icon-wrap">{notifIcon(n.type)}</div>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-body">{n.body}</div>
                        <div className="notif-time">{n.time}</div>
                      </div>
                      <button className="notif-dismiss" onClick={() => dismiss(n.id)} title="Dismiss">
                        <X size={12} />
                      </button>
                    </div>
                  ))
                }
              </div>

              <div className="dropdown-footer">
                <Link to="/circulation" onClick={() => setNotifOpen(false)} className="dropdown-footer-link">
                  View all activity
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Settings ── */}
        <button
          className="header-icon-btn"
          title="Settings"
          onClick={() => { navigate('/settings'); setNotifOpen(false); setUserOpen(false); }}
        >
          <Settings size={18} />
        </button>

        {/* ── User menu ── */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            className="header-user-pill"
            onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
          >
            <div className="header-avatar">{initials}</div>
            <span className="header-user-name">{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transition: 'transform var(--t-fast)', transform: userOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {userOpen && (
            <div className="dropdown user-dropdown">
              <div className="user-dropdown-profile">
                <div className="user-dropdown-avatar">{initials}</div>
                <div>
                  <div className="user-dropdown-name">{user?.name}</div>
                  <div className="user-dropdown-email">{user?.email}</div>
                  <span className="badge badge-teal" style={{ fontSize: '0.68rem', marginTop: 4 }}>{user?.role}</span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <Link
                to="/settings"
                className="dropdown-item"
                onClick={() => setUserOpen(false)}
              >
                <User size={15} /> My Profile
              </Link>

              <Link
                to="/settings?tab=security"
                className="dropdown-item"
                onClick={() => setUserOpen(false)}
              >
                <Settings size={15} /> Settings
              </Link>

              <div className="dropdown-divider" />

              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
