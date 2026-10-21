import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, BarChart3, Shield, Bell, RefreshCw,
  ArrowRight, Star, CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: <BookOpen size={22} />,
    color: 'navy',
    title: 'Book Catalogue',
    desc: 'Manage your entire collection — add, update, track copies and availability in one place.',
  },
  {
    icon: <RefreshCw size={22} />,
    color: 'blue',
    title: 'Circulation Control',
    desc: 'Issue and return books seamlessly. Track due dates and reduce manual paperwork.',
  },
  {
    icon: <Users size={22} />,
    color: 'teal',
    title: 'Member Management',
    desc: 'Register members, assign roles, and view each member\'s borrowing history at a glance.',
  },
  {
    icon: <Bell size={22} />,
    color: 'amber',
    title: 'Overdue Alerts',
    desc: 'Automatic overdue detection and fines calculation keep your library running tight.',
  },
  {
    icon: <BarChart3 size={22} />,
    color: 'emerald',
    title: 'Analytics Dashboard',
    desc: 'Gain insights into borrowing trends, popular genres, and member activity.',
  },
  {
    icon: <Shield size={22} />,
    color: 'danger',
    title: 'Role-Based Access',
    desc: 'Admin, librarian, and member roles ensure everyone sees exactly what they need.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Create your account',
    desc: 'Sign up as an administrator and set up your library profile in minutes.',
  },
  {
    num: '02',
    title: 'Add your books',
    desc: 'Import or manually add your book catalogue with authors, genres and copies.',
  },
  {
    num: '03',
    title: 'Start managing',
    desc: 'Issue books to members, track returns, and let eSomero handle the rest.',
  },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-page">

      {/* ── Navbar ── */}
      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Link to="/" className="landing-nav-logo">
            <img src="/logo.png" alt="eSomero" />
            <span className="landing-nav-logo-name">eSomero</span>
          </Link>

          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#how" className="landing-nav-link">How it works</a>
            <Link to="/login" className="landing-nav-link">Sign in</Link>
            <Link to="/register" className="landing-nav-btn">Get started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div>
            <div className="landing-hero-badge">
              <span className="landing-hero-badge-dot" />
              Trusted by schools &amp; public libraries
            </div>

            <h1 className="landing-hero-title">
              Your Library,<br />
              <span>Always Ready.</span>
            </h1>

            <p className="landing-hero-sub">
              eSomero brings order to your library — catalogue books, manage members,
              track borrowing, and stay on top of overdue returns, all from one clean dashboard.
            </p>

            <div className="landing-hero-cta">
              <Link to="/register" className="landing-hero-btn-primary">
                Start for free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="landing-hero-btn-secondary">
                Sign in to your library
              </Link>
            </div>
          </div>

          {/* Stats panel (hides on mobile) */}
          <div className="landing-hero-visual">
            <div className="landing-stat-card">
              <div className="landing-stat-value">10k+</div>
              <div className="landing-stat-label">Books managed</div>
            </div>
            <div className="landing-stat-card">
              <div className="landing-stat-value">98%</div>
              <div className="landing-stat-label">Return rate</div>
            </div>
            <div className="landing-stat-card">
              <div className="landing-stat-icon">
                <Star size={20} fill="currentColor" />
              </div>
              <div>
                <div className="landing-stat-value" style={{ fontSize: '1.6rem' }}>
                  Loved by librarians
                </div>
                <div className="landing-stat-label">Simple, fast, reliable</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features" id="features">
        <div className="landing-section-label">What you get</div>
        <h2 className="landing-section-title">Everything a library needs</h2>
        <p className="landing-section-sub">
          From a solo community library to a school with hundreds of members —
          eSomero scales to fit your needs.
        </p>

        <div className="landing-features-grid">
          {features.map(f => (
            <div className="landing-feature-card" key={f.title}>
              <div className={`landing-feature-icon ${f.color}`}>{f.icon}</div>
              <div className="landing-feature-title">{f.title}</div>
              <div className="landing-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote banner ── */}
      <section className="landing-quote">
        <div className="landing-quote-inner">
          <div className="landing-quote-marks">"</div>
          <p className="landing-quote-text">
            A library is not a luxury but one of the necessities of life —
            and the right tools make it possible to serve every reader well.
          </p>
          <div className="landing-quote-author">— Henry Ward Beecher</div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-how" id="how">
        <div className="landing-how-inner">
          <div className="landing-section-label">Getting started</div>
          <h2 className="landing-section-title">Up and running in minutes</h2>
          <p className="landing-section-sub">
            No training needed. eSomero is built to be intuitive from day one.
          </p>

          <div className="landing-steps">
            {steps.map(s => (
              <div className="landing-step" key={s.num}>
                <div className="landing-step-num">{s.num}</div>
                <div className="landing-step-title">{s.title}</div>
                <p className="landing-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's included ── */}
      <section style={{ padding: '72px 32px', background: 'var(--white)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div className="landing-section-label">Included in every plan</div>
            <h2 className="landing-section-title">No hidden features</h2>
            <p className="landing-section-sub" style={{ marginBottom: 32 }}>
              Every eSomero account includes the full feature set —
              no tiers, no pay-walls.
            </p>
            {[
              'Unlimited books & members',
              'Automatic overdue detection',
              'Fine tracking & payment log',
              'Role-based access control',
              'Full borrowing history',
              'Search & filter across everything',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircle size={18} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Visual card */}
          <div style={{
            background: 'linear-gradient(145deg, var(--navy) 0%, #1e3a8a 100%)',
            borderRadius: 'var(--r-xl)',
            padding: 36,
            color: 'white',
          }}>
            <img src="/logo.png" alt="eSomero" style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 20 }} />
            <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>eSomero</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.65, marginBottom: 28 }}>Your Library, Always</div>
            {[
              { label: 'Books in catalogue', value: '—' },
              { label: 'Active members',     value: '—' },
              { label: 'Books on loan',      value: '—' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.1)', fontSize: '0.88rem' }}>
                <span style={{ opacity: 0.65 }}>{r.label}</span>
                <span style={{ fontWeight: 700 }}>{r.value}</span>
              </div>
            ))}
            <Link to="/register" className="landing-hero-btn-primary" style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}>
              Set up your library <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2 className="landing-cta-title">Ready to take control?</h2>
          <p className="landing-cta-sub">
            Join libraries already using eSomero to manage their collections
            and serve their communities better.
          </p>
          <div className="landing-cta-actions">
            <Link to="/register" className="landing-hero-btn-primary">
              Create your account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="landing-hero-btn-secondary" style={{
              background: 'transparent',
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}>
              Sign in instead
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Link to="/" className="landing-footer-logo">
            <img src="/logo.png" alt="eSomero" />
            <span className="landing-footer-logo-text">eSomero</span>
          </Link>

          <div className="landing-footer-copy">
            © {new Date().getFullYear()} eSomero · Your Library, Always
          </div>

          <div className="landing-footer-links">
            <Link to="/login" className="landing-footer-link">Sign in</Link>
            <Link to="/register" className="landing-footer-link">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
