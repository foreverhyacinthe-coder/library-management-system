import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, RefreshCw, Users, UserCheck,
  AlertTriangle, BookMarked, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
  { to: '/books',     icon: <BookOpen size={17} />,        label: 'Books' },
  { to: '/circulation', icon: <RefreshCw size={17} />,     label: 'Circulation',  roles: ['admin', 'librarian'] },
  { to: '/members',   icon: <Users size={17} />,           label: 'Members',      roles: ['admin', 'librarian'] },
  { to: '/authors',   icon: <UserCheck size={17} />,       label: 'Authors' },
  { to: '/penalties', icon: <AlertTriangle size={17} />,   label: 'Penalties',    roles: ['admin', 'librarian'] },
  { to: '/my-borrows',icon: <BookMarked size={17} />,      label: 'My Borrows',   roles: ['member'] },
];

const Sidebar = () => {
  const { user, logout, canManage } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role ?? '');
  });

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <NavLink to="/dashboard" className="sidebar-logo">
          <img src="/logo.png" alt="eSomero" className="sidebar-logo-img" />
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">eSomero</span>
            <span className="sidebar-logo-tagline">Your Library, Always</span>
          </div>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">
          {canManage ? 'Management' : 'Navigation'}
        </div>

        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
