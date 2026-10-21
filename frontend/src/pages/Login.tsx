import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, BarChart3, Shield, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const features = [
  { icon: <BookOpen size={15} />, text: 'Complete book catalogue management' },
  { icon: <Users size={15} />,    text: 'Member tracking & borrowing history' },
  { icon: <BarChart3 size={15} />, text: 'Analytics and overdue alerts' },
  { icon: <Shield size={15} />,   text: 'Secure role-based access control' },
];

const Login = () => {
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      showToast('success', 'Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── Left decorative panel ── */}
      <div className="login-left">
        {/* Top orb decorations */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,.22) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: -80,
          width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,.1) 0%, transparent 70%)',
        }} />

        <div className="login-brand">
          {/* Actual logo image */}
          <img
            src="/logo.png"
            alt="eSomero"
            style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 20, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.3))' }}
          />
          <div className="login-brand-name">eSomero</div>
          <div className="login-brand-tagline">Your Library, Always</div>
        </div>

        <ul className="login-features">
          {features.map((f, i) => (
            <li key={i} className="login-feature-item">
              <div className="login-feature-icon">{f.icon}</div>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>

        {/* Bottom stat strip */}
        <div style={{
          display: 'flex', gap: 32, marginTop: 48, zIndex: 1,
          padding: '18px 24px',
          background: 'rgba(255,255,255,.06)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(255,255,255,.08)',
        }}>
          {[
            { v: '10k+', l: 'Books' },
            { v: '500+', l: 'Members' },
            { v: '99%', l: 'Uptime' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>{s.v}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className="login-form-card">

          {/* Mobile logo (hidden on desktop via login-left visibility) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <img src="/logo.png" alt="eSomero" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.01em' }}>eSomero</span>
          </div>

          <div className="login-form-header">
            <h1>Welcome back</h1>
            <p>Sign in to access your library dashboard</p>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', padding: 4,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="login-submit-btn" type="submit" disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={18} style={{ animation: 'spin 0.9s linear infinite' }} /> Signing in…
                  </span>
                : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Sign in <ArrowRight size={16} />
                  </span>
              }
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                Create one
              </Link>
            </span>
          </div>

          <p style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Or contact your administrator if you need access.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
