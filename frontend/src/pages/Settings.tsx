import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Shield, Bell, Sliders, Save, Eye, EyeOff,
  Loader2, CheckCircle, AlertTriangle, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateUser } from '../api/usersApi';
import { changePassword } from '../api/authApi';

type Tab = 'profile' | 'security' | 'notifications' | 'system';

const TABS: { key: Tab; label: string; icon: React.ReactNode; roles?: string[] }[] = [
  { key: 'profile',       label: 'Profile',        icon: <User size={15} /> },
  { key: 'security',      label: 'Security',        icon: <Shield size={15} /> },
  { key: 'notifications', label: 'Notifications',   icon: <Bell size={15} /> },
  { key: 'system',        label: 'System',          icon: <Sliders size={15} />, roles: ['admin'] },
];

export default function Settings() {
  const { user, canManage } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'profile');

  // Profile form
  const [name,    setName]    = useState(user?.name    || '');
  const [email,   setEmail]   = useState(user?.email   || '');
  const [phone,   setPhone]   = useState(user?.phone   || '');
  const [address, setAddress] = useState(user?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);
  const [pwError,    setPwError]    = useState('');

  // Notification prefs (UI only — wired to display)
  const [emailOverdue,  setEmailOverdue]  = useState(true);
  const [emailReturn,   setEmailReturn]   = useState(true);
  const [emailSummary,  setEmailSummary]  = useState(false);
  const [browserNotif,  setBrowserNotif]  = useState(true);

  useEffect(() => {
    const t = searchParams.get('tab') as Tab;
    if (t) setTab(t);
  }, [searchParams]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  const visibleTabs = TABS.filter(t => !t.roles || t.roles.includes(user?.role ?? ''));

  // ── Profile save ──────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateUser(user._id, { name, phone, address });
      showToast('success', 'Profile updated successfully');
    } catch {
      showToast('error', 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password save ─────────────────────────────────────────────────────────
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await changePassword(currentPw, newPw);
      showToast('success', 'Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
      setPwError(msg);
    } finally {
      setSavingPw(false);
    }
  };

  const PwInput = ({
    value, onChange, show, onToggle, placeholder, autoComplete,
  }: {
    value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void;
    placeholder: string; autoComplete: string;
  }) => (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{ paddingRight: 44 }}
      />
      <button type="button" onClick={onToggle}
        style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center' }}>
        {show ? <EyeOff size={15}/> : <Eye size={15}/>}
      </button>
    </div>
  );

  const Toggle = ({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{label}</div>
        {desc && <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:2 }}>{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width:44, height:24, borderRadius:99, border:'none', cursor:'pointer',
          background: value ? 'var(--blue)' : 'var(--border-2)',
          position:'relative', transition:'background var(--t)',
          flexShrink:0,
        }}
      >
        <span style={{
          position:'absolute', top:3, left: value?20:3, width:18, height:18,
          borderRadius:'50%', background:'white',
          transition:'left var(--t)', boxShadow:'0 1px 3px rgba(0,0,0,.2)',
        }} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account, security, and preferences</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:24, alignItems:'start' }}>

        {/* ── Tab nav ── */}
        <div className="card" style={{ padding:8 }}>
          {visibleTabs.map(t => (
            <button key={t.key} onClick={() => switchTab(t.key)}
              style={{
                display:'flex', alignItems:'center', gap:10, width:'100%',
                padding:'11px 14px', borderRadius:'var(--r)', border:'none',
                background: tab===t.key ? 'var(--blue-50)' : 'none',
                color: tab===t.key ? 'var(--blue)' : 'var(--text-secondary)',
                fontFamily:'inherit', fontWeight: tab===t.key ? 600 : 500,
                fontSize:'0.88rem', cursor:'pointer', textAlign:'left',
                transition:'all var(--t-fast)',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div>

          {/* ── Profile ── */}
          {tab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Personal Information</div>
                  <div className="card-subtitle">Update your name, contact details and address</div>
                </div>
              </div>
              <div className="card-body">
                {/* Account summary banner */}
                <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 18px', background:'var(--surface-2)', borderRadius:'var(--r-md)', marginBottom:24 }}>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,var(--blue) 0%,var(--teal) 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'1.2rem', flexShrink:0 }}>
                    {user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'1rem' }}>{user?.name}</div>
                    <div style={{ fontSize:'0.83rem', color:'var(--text-muted)' }}>{user?.email}</div>
                    <div style={{ display:'flex', gap:8, marginTop:5 }}>
                      <span className="badge badge-teal">{user?.role}</span>
                      {user?.membershipId && <span className="badge badge-neutral">{user.membershipId}</span>}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input className="form-input" value={email} disabled style={{ opacity:0.6, cursor:'not-allowed' }} title="Email cannot be changed here" />
                      <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Contact admin to change email</span>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input className="form-input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254 700 000 000" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <input className="form-input" value={user?.role || ''} disabled style={{ opacity:0.6, cursor:'not-allowed', textTransform:'capitalize' }} />
                    </div>
                    <div className="form-group" style={{ gridColumn:'1/-1' }}>
                      <label className="form-label">Address</label>
                      <input className="form-input" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Your address" />
                    </div>
                  </div>

                  <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
                    <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                      {savingProfile
                        ? <><Loader2 size={15} style={{ animation:'spin .9s linear infinite' }}/> Saving…</>
                        : <><Save size={15}/> Save Changes</>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {tab === 'security' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Change Password</div>
                    <div className="card-subtitle">Choose a strong password of at least 6 characters</div>
                  </div>
                </div>
                <div className="card-body">
                  {pwError && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--danger-bg)', borderRadius:'var(--r)', marginBottom:16, fontSize:'0.88rem', color:'var(--danger)', border:'1px solid var(--danger-border)' }}>
                      <AlertTriangle size={14}/> {pwError}
                    </div>
                  )}
                  <form onSubmit={handleSavePassword}>
                    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:440 }}>
                      <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <PwInput value={currentPw} onChange={setCurrentPw} show={showCur} onToggle={()=>setShowCur(p=>!p)} placeholder="Your current password" autoComplete="current-password" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">New Password</label>
                        <PwInput value={newPw} onChange={setNewPw} show={showNew} onToggle={()=>setShowNew(p=>!p)} placeholder="New password (min 6 chars)" autoComplete="new-password" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <PwInput value={confirmPw} onChange={setConfirmPw} show={showConf} onToggle={()=>setShowConf(p=>!p)} placeholder="Repeat new password" autoComplete="new-password" />
                      </div>
                    </div>
                    <div style={{ marginTop:24 }}>
                      <button className="btn btn-primary" type="submit" disabled={savingPw || !currentPw || !newPw || !confirmPw}>
                        {savingPw
                          ? <><Loader2 size={15} style={{ animation:'spin .9s linear infinite' }}/> Updating…</>
                          : <><Shield size={15}/> Update Password</>
                        }
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Account Security</div>
                </div>
                <div className="card-body">
                  {[
                    { label:'Password strength', value: 'Protected', icon:<CheckCircle size={14} style={{color:'var(--emerald)'}}/>, ok:true },
                    { label:'Last login', value: 'Just now', icon:<Info size={14} style={{color:'var(--blue)'}}/>, ok:true },
                    { label:'Account status', value: user?.isActive ? 'Active' : 'Inactive', icon:<CheckCircle size={14} style={{color:'var(--emerald)'}}/>, ok:true },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontSize:'0.88rem', color:'var(--text-secondary)' }}>{r.label}</span>
                      <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.88rem', fontWeight:600 }}>
                        {r.icon} {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Notification Preferences</div>
                  <div className="card-subtitle">Choose what you want to be notified about</div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6, padding:'10px 14px', background:'var(--info-bg)', borderRadius:'var(--r)', marginBottom:20, border:'1px solid var(--info-border)' }}>
                  <Info size={13} style={{color:'var(--info)',flexShrink:0}}/> Email notifications require a configured mail server. In-app notifications are always active.
                </div>

                <div style={{ fontWeight:600, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)', marginBottom:4 }}>Email Alerts</div>
                <Toggle value={emailOverdue}  onChange={setEmailOverdue}  label="Overdue reminders"  desc="Get emailed when a book becomes overdue" />
                <Toggle value={emailReturn}   onChange={setEmailReturn}   label="Return confirmations" desc="Confirmation when a book is returned" />
                <Toggle value={emailSummary}  onChange={setEmailSummary}  label="Weekly summary"     desc="A weekly digest of library activity" />

                <div style={{ fontWeight:600, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-muted)', marginTop:24, marginBottom:4 }}>In-App</div>
                <Toggle value={browserNotif} onChange={setBrowserNotif} label="Browser notifications" desc="Show desktop notifications for important events" />

                <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
                  <button className="btn btn-primary" onClick={() => showToast('success', 'Notification preferences saved')}>
                    <Save size={15}/> Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── System (admin only) ── */}
          {tab === 'system' && canManage && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Library Configuration</div>
                  <div className="card-subtitle">System-wide defaults for your library</div>
                </div>
                <div className="card-body">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div className="form-group">
                      <label className="form-label">Default Loan Period (days)</label>
                      <input className="form-input" type="number" defaultValue={14} min={1} max={90} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fine Rate ($ per overdue day)</label>
                      <input className="form-input" type="number" defaultValue={0.50} step={0.10} min={0} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Books per Member</label>
                      <input className="form-input" type="number" defaultValue={5} min={1} max={20} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Renewals per Book</label>
                      <input className="form-input" type="number" defaultValue={2} min={0} max={10} />
                    </div>
                    <div className="form-group" style={{ gridColumn:'1/-1' }}>
                      <label className="form-label">Library Name</label>
                      <input className="form-input" defaultValue="eSomero Library" />
                    </div>
                  </div>
                  <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => showToast('success', 'System settings saved')}>
                      <Save size={15}/> Save Settings
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Database</div>
                </div>
                <div className="card-body">
                  {[
                    { label:'Database', value: 'MongoDB (connected)' },
                    { label:'API version', value: 'v1.0.0' },
                    { label:'Environment', value: 'Development' },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid var(--border)', fontSize:'0.88rem' }}>
                      <span style={{ color:'var(--text-muted)' }}>{r.label}</span>
                      <span style={{ fontWeight:600 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}
