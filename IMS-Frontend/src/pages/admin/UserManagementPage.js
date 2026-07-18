import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import {
  Avatar, RoleBadge, PageLoader, EmptyState, Pagination,
  Modal, Alert, Spinner, ConfirmDialog, useToast, ToastStack, PageHeader,
} from '../../components/common';
import { fmtAgo, DEPARTMENTS, apiErr } from '../../utils/helpers';

const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'LOCKED'];

export default function UserManagementPage() {
  const toast = useToast();
  const [users,   setUsers]  = useState([]);
  const [loading, setLoad]   = useState(true);
  const [page,    setPage]   = useState(0);
  const [tp,      setTp]     = useState(0);
  const [total,   setTotal]  = useState(0);
  const [search,  setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDeact,  setShowDeact]  = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [formErr,    setFormErr]    = useState('');
  const [fieldErrs,  setFieldErrs]  = useState({});

  const emptyCreate = {
    username:   '',
    email:      '',
    password:   '',
    fullName:   '',
    phone:      '',
    department: '',
    employeeId: '',
    location:   '',
    roleCode:   'REPORTER',
  };
  const [cf, setCf] = useState(emptyCreate);
  const [ef, setEf] = useState({ fullName:'', phone:'', department:'', location:'', status:'ACTIVE' });

  const fetchUsers = useCallback(async (p = 0) => {
    setLoad(true);
    try {
      const res = await adminAPI.listUsers({ page: p, size: 15 });
      const d   = res.data.data;
      setUsers(d.content      || []);
      setTp(d.totalPages      || 0);
      setTotal(d.totalElements || 0);
      setPage(p);
    } catch { toast.error('Failed to load users'); }
    finally   { setLoad(false); }
  }, []);

  useEffect(() => { fetchUsers(0); }, [fetchUsers]);

  const openEdit = u => {
    setSelected(u);
    setEf({ fullName: u.fullName||'', phone: u.phone||'', department: u.department||'', location: u.location||'', status: u.status });
    setFormErr(''); setFieldErrs({}); setShowEdit(true);
  };

  const validateCreate = () => {
    const e = {};
    if (!cf.username.trim())   e.username   = 'Username is required';
    if (!cf.email.trim())      e.email      = 'Email is required';
    if (!cf.password.trim())   e.password   = 'Password is required';
    if (cf.password.length > 0 && cf.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!cf.fullName.trim())   e.fullName   = 'Full name is required';
    if (!cf.phone.trim())      e.phone      = 'Phone number is required';
    if (!cf.department.trim()) e.department = 'Department is required';
    if (!cf.employeeId.trim()) e.employeeId = 'Employee ID is required';
    if (!cf.location.trim())   e.location   = 'Location is required';
    if (!cf.roleCode)          e.roleCode   = 'Role is required';
    setFieldErrs(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async e => {
    e.preventDefault();
    setFormErr('');
    if (!validateCreate()) {
      setFormErr('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.createUser(cf);
      toast.success(`User "${cf.fullName}" created successfully`);
      setShowCreate(false);
      setCf(emptyCreate);
      setFieldErrs({});
      fetchUsers(0);
    } catch (err) {
      const msg = apiErr(err);
      setFormErr(msg);
    } finally { setSaving(false); }
  };

  const handleEdit = async e => {
    e.preventDefault();
    setFormErr('');
    setSaving(true);
    try {
      await adminAPI.updateUser(selected.userId, ef);
      toast.success('User updated successfully');
      setShowEdit(false);
      fetchUsers(page);
    } catch (err) { setFormErr(apiErr(err)); }
    finally       { setSaving(false); }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try {
      await adminAPI.deleteUser(selected.userId);
      toast.success(`User "${selected?.fullName || selected?.username}" deactivated`);
      setShowDeact(false);
      fetchUsers(page);
    } catch (err) { toast.error(apiErr(err)); }
    finally       { setSaving(false); }
  };

  const c  = (k, v) => { setCf(f => ({ ...f, [k]: v })); setFieldErrs(fe => ({ ...fe, [k]: '' })); };
  const ee = (k, v) => setEf(f => ({ ...f, [k]: v }));

  const filtered = search ? users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) : users;

  const FE = ({ field, label }) =>
    fieldErrs[field] ? (
      <p style={{ fontSize:11, color:'var(--red-600)', marginTop:3, fontWeight:500 }}>
        ⚠ {fieldErrs[field]}
      </p>
    ) : null;

  const inputCls = field =>
    `form-input${fieldErrs[field] ? ' form-input-error' : ''}`;

  return (
    <div className="anim-in">
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title="👥 User Management"
        sub={`${total} users in the system`}
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchUsers(page)}>↻ Refresh</button>
          <button className="btn btn-primary" onClick={() => { setFormErr(''); setFieldErrs({}); setCf(emptyCreate); setShowCreate(true); }}>
            ➕ Create User
          </button>
        </>}
      />

      <div className="info-banner">
        <div className="info-banner-icon">🔐</div>
        <div>
          <div className="info-banner-title">Admin Governance Rules</div>
          <div className="info-banner-text">
            No impersonation · Soft deactivation only · All changes are audit-logged · Roles are RBAC-enforced at API level
          </div>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-wrap" style={{ flex:1, maxWidth:340 }}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by name, username, email…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {search && <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>✕ Clear</button>}
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-m)' }}>{filtered.length} shown</span>
        </div>

        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <EmptyState icon="👤" title="No users found"
            action={<button className="btn btn-primary btn-sm" onClick={() => { setCf(emptyCreate); setFieldErrs({}); setShowCreate(true); }}>Create First User</button>} />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th><th>Email</th><th>Role</th>
                    <th>Department</th><th>Employee ID</th><th>Status</th><th>Last Login</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.userId}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={u.fullName || u.username} size="avatar-sm" />
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{u.fullName || u.username}</div>
                            <div style={{ fontSize:11, color:'var(--text-m)', fontFamily:'var(--mono)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize:12, color:'var(--text-m)' }}>{u.email}</td>
                      <td><RoleBadge role={u.roleCode} /></td>
                      <td style={{ fontSize:12, color:'var(--text-m)' }}>{u.department || '—'}</td>
                      <td style={{ fontSize:12, color:'var(--text-m)', fontFamily:'var(--mono)' }}>{u.employeeId || '—'}</td>
                      <td><span className={`badge us-${u.status}`}>{u.status}</span></td>
                      <td style={{ fontSize:11, color:'var(--text-m)' }}>
                        {u.lastLoginAt ? fmtAgo(u.lastLoginAt) : 'Never'}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️ Edit</button>
                          {u.status === 'ACTIVE' && (
                            <button className="btn btn-danger btn-sm" onClick={() => { setSelected(u); setShowDeact(true); }}>
                              🚫
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} totalPages={tp} onPage={fetchUsers} />
          </>
        )}
      </div>

      {}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="➕ Create New User" size="modal-lg"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
            {saving ? <><Spinner size="spinner-sm" />Creating…</> : '✓ Create User'}
          </button>
        </>}>

        {formErr && <Alert type="danger">{formErr}</Alert>}

        {}
        <div className="section-label">Section A — Basic Information (All fields required)</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Username <span className="req">*</span></label>
            <input className={inputCls('username')} placeholder="e.g. john.doe" value={cf.username} onChange={e => c('username', e.target.value)} />
            <FE field="username" />
          </div>
          <div className="form-group">
            <label className="form-label">Full Name <span className="req">*</span></label>
            <input className={inputCls('fullName')} placeholder="John Doe" value={cf.fullName} onChange={e => c('fullName', e.target.value)} />
            <FE field="fullName" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email <span className="req">*</span></label>
            <input className={inputCls('email')} type="email" placeholder="john@company.com" value={cf.email} onChange={e => c('email', e.target.value)} />
            <FE field="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span className="req">*</span></label>
            <input className={inputCls('password')} type="password" placeholder="Min 6 characters" value={cf.password} onChange={e => c('password', e.target.value)} />
            <FE field="password" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number <span className="req">*</span></label>
            <input className={inputCls('phone')} placeholder="+91 99999 00000" value={cf.phone} onChange={e => c('phone', e.target.value)} />
            <FE field="phone" />
          </div>
          <div className="form-group">
            <label className="form-label">Employee ID <span className="req">*</span></label>
            <input className={inputCls('employeeId')} placeholder="EMP001" value={cf.employeeId} onChange={e => c('employeeId', e.target.value)} />
            <FE field="employeeId" />
          </div>
        </div>

        <hr className="divider" />

        {}
        <div className="section-label">Section B — Organization Details (All fields required)</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Department <span className="req">*</span></label>
            <select className={`form-select${fieldErrs.department ? ' form-input-error' : ''}`}
              value={cf.department} onChange={e => c('department', e.target.value)}>
              <option value="">— Select department —</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <FE field="department" />
          </div>
          <div className="form-group">
            <label className="form-label">Location <span className="req">*</span></label>
            <input className={inputCls('location')} placeholder="e.g. Hyderabad, India" value={cf.location} onChange={e => c('location', e.target.value)} />
            <FE field="location" />
          </div>
        </div>

        <hr className="divider" />

        {}
        <div className="section-label">Section C — Role Assignment</div>
        <div className="form-group">
          <label className="form-label">Role <span className="req">*</span></label>
          <select className="form-select" value={cf.roleCode} onChange={e => c('roleCode', e.target.value)}>
            <option value="REPORTER">End User / Reporter — can raise & track own incidents</option>
            <option value="RESOLVER">Support Engineer (L2/L3) — investigates & resolves assigned incidents</option>
            <option value="INC_MANAGER">Incident Manager — monitors, assigns, escalates, closes incidents</option>
            <option value="ADMIN">System Administrator — governance only (no incident operations)</option>
          </select>
          <p className="form-hint" style={{ marginTop:6 }}>
            ⚠️ Role determines what the user can and cannot do. Admin assigns roles but does not execute them operationally.
          </p>
        </div>
      </Modal>

      {}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit User"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleEdit} disabled={saving}>
            {saving ? <><Spinner size="spinner-sm" />Saving…</> : '✓ Save Changes'}
          </button>
        </>}>
        {formErr && <Alert type="danger">{formErr}</Alert>}
        {selected && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--gray-50)', borderRadius:'var(--r)', marginBottom:20, border:'1px solid var(--border)' }}>
              <Avatar name={selected.fullName || selected.username} size="avatar-lg" />
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{selected.fullName || selected.username}</div>
                <div style={{ fontSize:12, color:'var(--text-m)', marginTop:2 }}>{selected.email}</div>
                <div style={{ marginTop:5 }}><RoleBadge role={selected.roleCode} /></div>
              </div>
            </div>
            <div className="info-banner" style={{ marginBottom:16 }}>
              <div className="info-banner-icon">🔒</div>
              <div className="info-banner-text">
                Username and email cannot be changed. Role changes are audit-logged automatically.
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={ef.fullName} onChange={e => ee('fullName', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={ef.phone} onChange={e => ee('phone', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={ef.department} onChange={e => ee('department', e.target.value)}>
                  <option value="">— Select —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={ef.location} onChange={e => ee('location', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select className="form-select" value={ef.status} onChange={e => ee('status', e.target.value)}>
                {USER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="form-hint">Status changes are logged automatically.</p>
            </div>
          </>
        )}
      </Modal>

      {}
      <ConfirmDialog
        open={showDeact} onClose={() => setShowDeact(false)}
        onConfirm={handleDeactivate} loading={saving}
        title="🚫 Deactivate User"
        message={`Are you sure you want to deactivate "${selected?.fullName || selected?.username}"?\n\nThey will immediately lose access to IMS. All their incidents remain unchanged and auditable. You can reactivate them by editing their account status.`}
        confirmLabel="Deactivate User" variant="danger"
      />
    </div>
  );
}
