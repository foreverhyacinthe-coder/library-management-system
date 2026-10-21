import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/ui/Toast';
import AppLayout from './components/layout/AppLayout';

import Landing    from './pages/Landing';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Books      from './pages/Books';
import Circulation from './pages/Circulation';
import Members    from './pages/Members';
import Authors    from './pages/Authors';
import Penalties  from './pages/Penalties';
import MyBorrows  from './pages/MyBorrows';
import Settings   from './pages/Settings';

import './styles/globals.css';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--blue-100)', borderTopColor: 'var(--blue)', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '0.9rem' }}>Loading eSomero…</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// Redirect logged-in users away from public pages
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <PublicRoute><Landing /></PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />

      {/* Protected app routes (with sidebar + header layout) */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/books"       element={<Books />} />
        <Route path="/authors"     element={<Authors />} />
        <Route path="/settings"    element={<Settings />} />

        <Route path="/circulation" element={
          <ProtectedRoute roles={['admin', 'librarian']}>
            <Circulation />
          </ProtectedRoute>
        } />

        <Route path="/members" element={
          <ProtectedRoute roles={['admin', 'librarian']}>
            <Members />
          </ProtectedRoute>
        } />

        <Route path="/penalties" element={
          <ProtectedRoute roles={['admin', 'librarian']}>
            <Penalties />
          </ProtectedRoute>
        } />

        <Route path="/my-borrows" element={
          <ProtectedRoute roles={['member']}>
            <MyBorrows />
          </ProtectedRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
          <Toast />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
