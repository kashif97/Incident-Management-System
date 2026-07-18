import React, { useState, useEffect } from 'react';
import { profileAPI } from '../../api';
import {
  Avatar, RoleBadge, PageLoader, Alert, Spinner,
  useToast, ToastStack, PageHeader,
} from '../../components/common';
import { fmtDt, DEPARTMENTS, apiErr } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const toast        = useToast();
  const { user: authUser } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoad]     = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const [form, setForm] = useState({
    fullName: '', phone: '', department: '', location: '',
  });

  const loadProfile = async () => {
    setLoad(true);
    try {
      const r = await profileAPI.get();
      const p = r.data.data;
      setProfile(p);
      setForm({
        fullName:   p.fullName   || '',
        phone:      p.phone      || '',
        department: p.department || '',
        location:   p.location   || '',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoad(false); }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSave = async () => {
    if (!form.fullName.trim()) { setError('Full name is required'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const r = await profileAPI.update(form);
      setProfile(r.data.data);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) { setError(apiErr(e)); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    if (profile) {
      setForm({
        fullName:   profile.fullName   || '',
        phone:      profile.phone      || '',
        department: profile.department || '',
        location:   profile.location   || '',
      });
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <PageLoader text="Loading your profile…" />;
  if (!profile) return null;

  const roleDescriptions = {
    ADMIN:       'You manage users, SLAs, and system configuration. You have full governance access but do not participate in the incident lifecycle directly.',
    REPORTER:    'You can raise incidents and track their progress. Your raised incidents are prioritised and assigned to the right team by the Incident Manager.',
    RESOLVER:    'You are a Support Engineer. You investigate and resolve incidents assigned to you. You can add work notes and mark incidents as resolved.',
    INC_MANAGER: 'You oversee the incident lifecycle. You assign incidents, monitor SLAs, handle escalations, and approve closure of resolved incidents.',
  };

  return (
    <div className="anim-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title="👤 My Profile"
        sub="Manage your account details"
        actions={!editing && (
          <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
            ✏️ Edit Profile
          </button>
        )}
      />

      {success && <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>}
      {error   && <Alert type="danger"  onClose={() => setError('')}>{error}</Alert>}

      {/* Identity Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '28px 24px' }}>
          <Avatar name={profile.fullName || profile.username} size="avatar-xl" />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{profile.fullName || profile.username}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-m)', marginBottom: 12 }}>@{profile.username} · {profile.email}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <RoleBadge role={profile.roleCode} />
              <span className={`badge us-${profile.status}`}>{profile.status}</span>
              {profile.employeeId && (
                <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-m)', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                  EMP#{profile.employeeId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Role description */}
        <div style={{
          margin: '0 20px 20px',
          padding: '12px 16px',
          background: 'var(--blue-50)',
          border: '1px solid var(--blue-100)',
          borderRadius: 'var(--r-sm)',
          fontSize: 13,
          color: 'var(--text-s)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--primary)' }}>Your Role: {profile.roleName}</strong>
          <br />
          {roleDescriptions[profile.roleCode] || ''}
        </div>
      </div>

      {/* Editable Fields */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">📝 Personal Information</div>
          {editing && <span style={{ fontSize: 12, color: 'var(--text-m)' }}>Username & email cannot be changed</span>}
        </div>
        <div className="card-body">
          {/* Non-editable fields */}
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={profile.username} disabled
                style={{ background: 'var(--gray-50)', color: 'var(--text-m)' }} />
              <p className="form-hint">Cannot be changed</p>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={profile.email} disabled
                style={{ background: 'var(--gray-50)', color: 'var(--text-m)' }} />
              <p className="form-hint">Contact admin to change</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name {editing && <span className="req">*</span>}</label>
              {editing ? (
                <input className="form-input" value={form.fullName}
                  onChange={e => set('fullName', e.target.value)} />
              ) : (
                <div className="form-input" style={{ background: 'var(--surface)', color: 'var(--text-s)' }}>
                  {profile.fullName || '—'}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              {editing ? (
                <input className="form-input" placeholder="+91 99999 00000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              ) : (
                <div className="form-input" style={{ background: 'var(--surface)', color: 'var(--text-s)' }}>
                  {profile.phone || '—'}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              {editing ? (
                <select className="form-select" value={form.department}
                  onChange={e => set('department', e.target.value)}>
                  <option value="">— Select department —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <div className="form-input" style={{ background: 'var(--surface)', color: 'var(--text-s)' }}>
                  {profile.department || '—'}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              {editing ? (
                <input className="form-input" placeholder="e.g. Hyderabad, India"
                  value={form.location} onChange={e => set('location', e.target.value)} />
              ) : (
                <div className="form-input" style={{ background: 'var(--surface)', color: 'var(--text-s)' }}>
                  {profile.location || '—'}
                </div>
              )}
            </div>
          </div>

          {editing && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><Spinner size="spinner-sm" /> Saving…</> : '✓ Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Metadata */}
      <div className="card">
        <div className="card-header"><div className="card-title">🔐 Account Information</div></div>
        <div className="card-body-sm">
          {[
            ['Employee ID',    profile.employeeId || '—'],
            ['Account Status', profile.status],
            ['Role',           profile.roleName],
            ['Member Since',   fmtDt(profile.createdAt)],
            ['Last Login',     profile.lastLoginAt ? fmtDt(profile.lastLoginAt) : 'Never'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 14 }}>
              <span style={{ color: 'var(--text-m)', fontWeight: 500 }}>{label}</span>
              <span style={{ color: 'var(--text-s)', fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
