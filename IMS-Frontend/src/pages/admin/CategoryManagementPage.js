import React, { useState, useEffect, useCallback } from 'react';
import { categoryAPI } from '../../api';
import {
  PageLoader, EmptyState, Modal, Alert, Spinner,
  ConfirmDialog, useToast, ToastStack, PageHeader,
} from '../../components/common';
import { apiErr } from '../../utils/helpers';

export default function CategoryManagementPage() {
  const toast = useToast();
  const [cats,     setCats]    = useState([]);
  const [loading,  setLoad]    = useState(true);
  const [showNew,  setShowNew] = useState(false);
  const [showEdit, setShowEdit]= useState(false);
  const [showDel,  setShowDel] = useState(false);
  const [sel,      setSel]     = useState(null);
  const [saving,   setSaving]  = useState(false);
  const [formErr,  setFE]      = useState('');
  const [name,     setName]    = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async () => {
    setLoad(true);
    try {
      const res = showInactive
        ? await categoryAPI.listAll()
        : await categoryAPI.list();
      setCats(res.data.data || []);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoad(false); }
  }, [showInactive]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!name.trim()) { setFE('Category name is required'); return; }
    setFE(''); setSaving(true);
    try {
      await categoryAPI.create({ categoryName: name.trim() });
      toast.success(`Category "${name}" created`);
      setShowNew(false); setName(''); load();
    } catch (e) { setFE(apiErr(e)); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!name.trim()) { setFE('Category name is required'); return; }
    setFE(''); setSaving(true);
    try {
      await categoryAPI.update(sel.id, { categoryName: name.trim() });
      toast.success('Category updated');
      setShowEdit(false); setName(''); load();
    } catch (e) { setFE(apiErr(e)); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    setSaving(true);
    try {
      await categoryAPI.deactivate(sel.id);
      toast.success(`"${sel.categoryName}" deactivated`);
      setShowDel(false); load();
    } catch (e) { toast.error(apiErr(e)); }
    finally { setSaving(false); }
  };

  const handleReactivate = async (cat) => {
    try {
      await categoryAPI.reactivate(cat.id);
      toast.success(`"${cat.categoryName}" reactivated`);
      load();
    } catch (e) { toast.error(apiErr(e)); }
  };

  const openEdit = (cat) => {
    setSel(cat); setName(cat.categoryName); setFE(''); setShowEdit(true);
  };

  const active   = cats.filter(c => c.isActive);
  const inactive = cats.filter(c => !c.isActive);

  return (
    <div className="anim-in">
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title="🗂️ Category Management"
        sub={`${active.length} active categories`}
        actions={<>
          <button
            className={`btn btn-sm ${showInactive ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowInactive(v => !v)}>
            {showInactive ? '👁 Showing All' : '👁 Show Inactive'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-primary" onClick={() => { setName(''); setFE(''); setShowNew(true); }}>
            ➕ New Category
          </button>
        </>}
      />

      <div className="info-banner">
        <div className="info-banner-icon">💡</div>
        <div>
          <div className="info-banner-title">Categories classify incidents for routing</div>
          <div className="info-banner-text">
            When a reporter raises an incident they can choose a category (e.g. Network, Software, Security).
            Incident Managers use categories to route to the right team. Deactivated categories are hidden
            from new incident forms but existing incidents are unaffected.
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Active categories */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">✅ Active Categories ({active.length})</div>
            </div>
            {active.length === 0 ? (
              <EmptyState icon="🗂️" title="No active categories"
                action={<button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>Add First Category</button>} />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Category Name</th><th>Parent</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {active.map((c, idx) => (
                      <tr key={c.id}>
                        <td style={{ fontSize: 12, color: 'var(--text-m)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{c.categoryName}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-m)' }}>{c.parentName || '—'}</td>
                        <td><span className="badge sla-ok">Active</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️ Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => { setSel(c); setShowDel(true); }}>🚫 Deactivate</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Inactive categories */}
          {showInactive && inactive.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title" style={{ color: 'var(--text-m)' }}>🚫 Inactive Categories ({inactive.length})</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Category Name</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {inactive.map(c => (
                      <tr key={c.id} style={{ opacity: 0.6 }}>
                        <td style={{ fontWeight: 600, textDecoration: 'line-through' }}>{c.categoryName}</td>
                        <td><span className="badge us-INACTIVE">Inactive</span></td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleReactivate(c)}>
                            ♻️ Reactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="➕ New Category"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
            {saving ? <><Spinner size="spinner-sm" /> Creating…</> : 'Create Category'}
          </button>
        </>}>
        {formErr && <Alert type="danger">{formErr}</Alert>}
        <div className="form-group">
          <label className="form-label">Category Name <span className="req">*</span></label>
          <input className="form-input" placeholder="e.g. Network, Security, Database"
            value={name} onChange={e => { setName(e.target.value); setFE(''); }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <p className="form-hint">This will appear in the incident creation form for reporters.</p>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit Category"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleEdit} disabled={saving}>
            {saving ? <><Spinner size="spinner-sm" /> Saving…</> : 'Save Changes'}
          </button>
        </>}>
        {formErr && <Alert type="danger">{formErr}</Alert>}
        <div className="form-group">
          <label className="form-label">Category Name <span className="req">*</span></label>
          <input className="form-input" value={name}
            onChange={e => { setName(e.target.value); setFE(''); }} />
        </div>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={showDel} onClose={() => setShowDel(false)}
        onConfirm={handleDeactivate} loading={saving}
        title="🚫 Deactivate Category"
        message={`Deactivate "${sel?.categoryName}"?\n\nExisting incidents in this category are unaffected. This category will no longer appear in the incident creation form. You can reactivate it at any time.`}
        confirmLabel="Deactivate" variant="danger"
      />
    </div>
  );
}
