import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiErr } from '../../utils/helpers';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form,  setForm]  = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [show,  setShow]  = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    try {
      await login(form.username.trim(), form.password);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(apiErr(err) || 'Invalid username or password. Please try again.');
    }
  };

  const Feat = ({ icon, title, sub }) => (
    <div style={{ display:'flex', gap:14, padding:'14px 16px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, marginTop:10 }}>
      <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{icon}</span>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', marginBottom:2 }}>{title}</div>
        <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5 }}>{sub}</div>
      </div>
    </div>
  );

  return (
    <div className="login-shell">
      { }
      <div className="login-panel-left">
        <div className="login-left-content">
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:48 }}>
            <div style={{ width:52, height:52, background:'linear-gradient(135deg,#2563eb,#3b82f6)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', boxShadow:'0 8px 24px rgba(37,99,235,.45)', letterSpacing:'-.5px' }}>
              IMS
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:'#f8fafc', letterSpacing:'-.3px' }}>IMS Portal</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:1 }}>Incident Management System</div>
            </div>
          </div>

          <h1 style={{ fontSize:36, fontWeight:800, color:'#f8fafc', lineHeight:1.15, letterSpacing:'-1.5px', marginBottom:16 }}>
            Resolve incidents<br/>
            <span style={{ background:'linear-gradient(90deg,#60a5fa,#93c5fd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              faster than ever.
            </span>
          </h1>
          <p style={{ fontSize:14, color:'#64748b', lineHeight:1.8, marginBottom:4 }}>
            ITIL 4 aligned incident management with role-based access control,
            real-time SLA tracking, and intelligent escalation.
          </p>

          <Feat icon="🛡️" title="Role-Based Access Control (RBAC)"   sub="Admin · End User · Resolver · Incident Manager — fully isolated" />
          <Feat icon="⏱️" title="SLA Monitoring & Auto-Breach Detection" sub="Response & resolution timers with escalation triggers" />
          <Feat icon="📊" title="Live Dashboards for Every Role"      sub="KPIs, charts, and incident queues tailored per role" />
          <Feat icon="🔔" title="Real-Time Notifications"              sub="Comment alerts, assignment notices, and SLA warnings" />
        </div>
      </div>

      { }
      <div className="login-panel-right">
        <div style={{ width:'100%', maxWidth:360 }}>
          <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:'-.5px', marginBottom:6 }}>
            Welcome back 👋
          </h2>
          <p style={{ fontSize:14, color:'var(--text-m)', marginBottom:28 }}>
            Sign in to your IMS account
          </p>

          {}
          {error && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:10,
              padding:'14px 16px', marginBottom:20,
              background:'#fef2f2', border:'1px solid #fca5a5',
              borderRadius:'var(--r)', color:'#991b1b',
              fontSize:13, fontWeight:500, lineHeight:1.5,
              animation:'none',
            }}>
              <span style={{ fontSize:18, flexShrink:0 }}>🔐</span>
              <div>
                <div style={{ fontWeight:700, marginBottom:2 }}>Login Failed</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <div className="form-group">
              <label className="form-label">
                Username <span className="req">*</span>
              </label>
              <input
                className={`form-input ${error ? 'form-input-error' : ''}`}
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                style={{ borderColor: error ? '#dc2626' : undefined }}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="req">*</span>
              </label>
              <div style={{ position:'relative' }}>
                <input
                  className="form-input"
                  type={show ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight:44, borderColor: error ? '#dc2626' : undefined }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-m)', padding:4 }}>
                  {show ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width:'100%', marginTop:8 }}>
              {loading ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderTopColor:'#fff', borderColor:'rgba(255,255,255,.3)' }} />
                  Signing in…
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          {}
          <p style={{ marginTop:20, fontSize:12, color:'var(--text-m)', textAlign:'center', lineHeight:1.6 }}>
            Don't have an account?<br />
            Contact your <strong style={{ color:'var(--text-s)' }}>System Administrator</strong> to create one.
          </p>
        </div>
      </div>
    </div>
  );
}
