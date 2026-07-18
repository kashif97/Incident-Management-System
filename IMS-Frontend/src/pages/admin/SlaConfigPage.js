import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import {
  PageLoader, EmptyState, Modal, Alert, Spinner,
  ConfirmDialog, useToast, ToastStack, PageHeader,
} from '../../components/common';
import { fmtMins, PRIORITIES, PRIORITY_META, apiErr } from '../../utils/helpers';

export default function SlaConfigPage() {
  const toast = useToast();
  const [slas,    setSlas]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [showNew, setShowNew]= useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const [showDel, setShowDel]=useState(false);
  const [sel,     setSel]    = useState(null);
  const [saving,  setSaving] = useState(false);
  const [formErr, setFE]     = useState('');

  const def = { slaName:'', priority:'MEDIUM', responseTimeMinutes:'', resolutionTimeMinutes:'' };
  const [form, setForm] = useState(def);

  const load = async () => {
    setLoad(true);
    try { setSlas((await adminAPI.listSlas()).data.data || []); }
    catch { toast.error('Failed to load SLAs'); }
    finally { setLoad(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (isEdit) => {
    setFE('');
    if (!form.slaName || !form.responseTimeMinutes || !form.resolutionTimeMinutes) {
      setFE('All fields are required'); return;
    }
    if (Number(form.resolutionTimeMinutes) <= Number(form.responseTimeMinutes)) {
      setFE('Resolution time must be greater than response time'); return;
    }
    setSaving(true);
    try {
      const payload = { slaName: form.slaName, priority: form.priority, responseTimeMinutes: Number(form.responseTimeMinutes), resolutionTimeMinutes: Number(form.resolutionTimeMinutes) };
      if (isEdit) await adminAPI.updateSla(sel.slaId, payload);
      else        await adminAPI.createSla(payload);
      toast.success(`SLA ${isEdit ? 'updated' : 'created'}`);
      setShowNew(false); setShowEdit(false); setForm(def); load();
    } catch (e) { setFE(apiErr(e)); }
    finally    { setSaving(false); }
  };

  const handleDel = async () => {
    setSaving(true);
    try {
      await adminAPI.deleteSla(sel.slaId);
      toast.success('SLA deactivated');
      setShowDel(false); load();
    } catch (e) { toast.error(apiErr(e)); }
    finally     { setSaving(false); }
  };

  const openEdit = s => { setSel(s); setForm({ slaName:s.slaName, priority:s.priority, responseTimeMinutes:s.responseTimeMinutes, resolutionTimeMinutes:s.resolutionTimeMinutes }); setFE(''); setShowEdit(true); };

  const SlaForm = () => (
    <>
      {formErr && <Alert type="danger">{formErr}</Alert>}
      <div className="form-group">
        <label className="form-label">SLA Name <span className="req">*</span></label>
        <input className="form-input" placeholder="e.g. Critical Response SLA"
          value={form.slaName} onChange={e=>setForm(f=>({...f,slaName:e.target.value}))} />
      </div>

      <div className="form-group">
        <label className="form-label">Priority <span className="req">*</span></label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {PRIORITIES.map(p => {
            const m   = PRIORITY_META[p];
            const sel = form.priority === p;
            return (
              <button key={p} type="button"
                style={{
                  padding:'10px 12px', borderRadius:'var(--r-sm)', textAlign:'left',
                  border:`2px solid ${sel ? m.color : 'var(--border)'}`,
                  background: sel ? m.bg : 'var(--surface)',
                  cursor:'pointer', transition:'all .15s',
                  boxShadow: sel ? `0 2px 8px ${m.color}30` : 'none',
                }}
                onClick={() => setForm(f=>({...f,priority:p}))}>
                <div style={{ fontSize:13, fontWeight:700, color:m.color }}>{m.icon} {p}</div>
                <div style={{ fontSize:11, color:'var(--text-m)', marginTop:2 }}>{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Response Time (mins) <span className="req">*</span></label>
          <input className="form-input" type="number" min="1" placeholder="e.g. 60"
            value={form.responseTimeMinutes}
            onChange={e=>setForm(f=>({...f,responseTimeMinutes:e.target.value}))} />
          {form.responseTimeMinutes && (
            <p className="form-hint">= {fmtMins(Number(form.responseTimeMinutes))}</p>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Resolution Time (mins) <span className="req">*</span></label>
          <input className="form-input" type="number" min="1" placeholder="e.g. 480"
            value={form.resolutionTimeMinutes}
            onChange={e=>setForm(f=>({...f,resolutionTimeMinutes:e.target.value}))} />
          {form.resolutionTimeMinutes && (
            <p className="form-hint">= {fmtMins(Number(form.resolutionTimeMinutes))}</p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="anim-in">
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title="⏱️ SLA Configuration"
        sub="Define response and resolution time targets by priority level"
        actions={<button className="btn btn-primary" onClick={() => { setForm(def); setFE(''); setShowNew(true); }}>➕ New SLA</button>}
      />

      <div className="info-banner">
        <div className="info-banner-icon">💡</div>
        <div>
          <div className="info-banner-title">How SLAs Work</div>
          <div className="info-banner-text">
            When a reporter raises an incident, the system auto-applies the matching active SLA based on priority.
            The SLA clock starts immediately and breach alerts fire if deadlines are missed.
          </div>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <>
          {slas.length === 0 ? (
            <div className="card">
              <EmptyState icon="⏱️" title="No SLAs configured"
                sub="Create SLA policies for each priority level."
                action={<button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>Create First SLA</button>} />
            </div>
          ) : (
            <div className="grid-2">
              {slas.map(s => {
                const m = PRIORITY_META[s.priority] || {};
                return (
                  <div key={s.slaId} className="card" style={{
                    borderTop: `3px solid ${m.color || 'var(--primary)'}`,
                    opacity: s.isActive ? 1 : .55,
                  }}>
                    <div className="card-header">
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span className={`badge p-${s.priority}`}>{m.icon} {s.priority}</span>
                          {!s.isActive && <span className="badge us-INACTIVE">Inactive</span>}
                        </div>
                        <div className="card-title">{s.slaName}</div>
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button>
                        {s.isActive && <button className="btn btn-danger btn-sm" onClick={() => { setSel(s); setShowDel(true); }}>🗑️</button>}
                      </div>
                    </div>
                    <div className="card-body">
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        <div style={{ padding:'12px 14px', background:'var(--blue-50)', borderRadius:'var(--r-sm)', border:'1px solid var(--blue-100)' }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'var(--blue-800)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>🔔 Response Time</div>
                          <div style={{ fontSize:22, fontWeight:800, color:'var(--blue-700)', letterSpacing:'-.5px' }}>{fmtMins(s.responseTimeMinutes)}</div>
                          <div style={{ fontSize:11, color:'var(--blue-600)', marginTop:2 }}>{s.responseTimeMinutes} minutes</div>
                        </div>
                        <div style={{ padding:'12px 14px', background:'var(--green-50)', borderRadius:'var(--r-sm)', border:'1px solid var(--green-100)' }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'var(--green-800)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>✅ Resolution Time</div>
                          <div style={{ fontSize:22, fontWeight:800, color:'var(--green-700)', letterSpacing:'-.5px' }}>{fmtMins(s.resolutionTimeMinutes)}</div>
                          <div style={{ fontSize:11, color:'var(--green-600)', marginTop:2 }}>{s.resolutionTimeMinutes} minutes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="➕ Create New SLA"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => save(false)} disabled={saving}>
            {saving ? <><Spinner size="spinner-sm"/>Creating…</> : 'Create SLA'}
          </button>
        </>}>
        <SlaForm />
      </Modal>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit SLA"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => save(true)} disabled={saving}>
            {saving ? <><Spinner size="spinner-sm"/>Saving…</> : 'Save Changes'}
          </button>
        </>}>
        <SlaForm />
      </Modal>

      <ConfirmDialog
        open={showDel} onClose={() => setShowDel(false)}
        onConfirm={handleDel} loading={saving}
        title="🗑️ Deactivate SLA"
        message={`Deactivate "${sel?.slaName}"? New incidents will not use this SLA until you create a replacement. Existing incident SLAs remain unchanged.`}
        confirmLabel="Deactivate" variant="danger"
      />
    </div>
  );
}
