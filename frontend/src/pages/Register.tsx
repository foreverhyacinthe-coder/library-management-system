import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { register as registerApi } from '../api/authApi';

const passwordStrength = (pw: string) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–5
};

const strengthLabel = (s: number) => {
  if (s <= 1) return { label: 'Weak',   color: 'var(--danger)' };
  if (s <= 2) return { label: 'Fair',   color: 'var(--warning)' };
  if (s <= 3) return { label: 'Good',   color: 'var(--info)' };
  return               { label: 'Strong', color: 'var(--emerald)' };
};

const Register = () => {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const strength = passwordStrength(password);
  const { label: strengthText, color: strengthColor } = strengthLabel(strength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerApi(name.trim(), email, password);
      // Auto-login after registration
      await login(email, password);
      showToast('success', 'Account created! Welcome to eSomero.');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── Left panel ── */}
      <div className="login-left">
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

        <div className="login-brand">
          <img
            src="/logo.png"
            alt="eSomero"
            style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 20, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.3))' }}
          />
          <div className="login-brand-name">eSomero</div>
          <div className="login-brand-tagline">Your Library, Always</div>
        </div>

        {/* Benefits */}
        <ul className="login-features">
          {[
            'Browse the full book catalogue',
            'Track your borrowed books & due dates',
            'See your fine history at a glance',
            'Get notified when books are overdue',
          ].map((text, i) => (
            <li key={i} className="login-feature-item">
              <div className="login-feature-icon">
                <CheckCircle size={14} style={{ color: 'var(--teal-400)' }} />
              </div>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <div style={{
          zIndex: 1, marginTop: 40,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          background: 'rgba(255,255,255,.06)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid rgba(255,255,255,.08)',
        }}>
          <BookOpen size={20} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}>
            Members can browse books and track their borrowing history.
          </span>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className="login-form-card">

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <img src="/logo.png" alt="eSomero" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.01em' }}>eSomero</span>
          </div>

          <div className="login-form-header">
            <h1>Create an account</h1>
            <p>Join your library as a member</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            {/* Password strength bar */}
            {password.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 99,
                      background: i <= strength ? strengthColor : 'var(--border)',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: strengthColor, fontWeight: 600 }}>
                  {strengthText} password
                </span>
              </div>
            )}
            {password.length === 0 && <div style={{ marginBottom: 24 }} />}

            <button className="login-submit-btn" type="submit" disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={18} style={{ animation: 'spin 0.9s linear infinite' }} /> Creating account…
                  </span>
                : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    Create account <ArrowRight size={16} />
                  </span>
              }
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                Sign in
              </Link>
            </span>
          </div>

          <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            By creating an account, you agree to the library's terms of use.
            Admin and librarian accounts are created by your administrator.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
