import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentAPI, categoryAPI } from '../../api';
import { Alert, Spinner } from '../../components/common';
import { PRIORITIES, PRIORITY_META, apiErr } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function RaiseIncidentPage() {
  const navigate = useNavigate();
  const { isReporter } = useAuth();
  const [cats,    setCats]  = useState([]);
  const [loading, setLoad]  = useState(false);
  const [error,   setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', categoryId: '',
  });
  const [errs, setErrs] = useState({});

  useEffect(() => {
    categoryAPI.list().then(r => setCats(r.data.data || [])).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoad(true); setError('');
    try {
      const res = await incidentAPI.create({
        title:       form.title.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        categoryId:  form.categoryId ? Number(form.categoryId) : null,
      });
      navigate(`/app/incidents/${res.data.data.incidentId}`, { state: { created: true } });
    } catch (err) { setError(apiErr(err)); }
    finally       { setLoad(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const pm  = PRIORITY_META[form.priority];

  return (
    <div className="anim-in" style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            🆕 Raise a New Incident
          </h1>
          <p className="page-sub">
            Describe the issue clearly. SLA clock starts automatically on submission.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="info-banner">
        <div className="info-banner-icon">ℹ️</div>
        <div>
          <div className="info-banner-title">SLA automatically starts on submission</div>
          <div className="info-banner-text">Priority determines response & resolution time windows per your SLA configuration.</div>
        </div>
      </div>

      {error && <Alert type="danger" onClose={() => setError('')}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        {}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">📄 Incident Details</div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Title <span className="req">*</span></label>
              <input className="form-input" maxLength={300}
                placeholder="Brief, descriptive title of the issue"
                value={form.title}
                onChange={e => { set('title', e.target.value); setErrs(v=>({...v,title:''})); }} />
              {errs.title && <p className="form-error">{errs.title}</p>}
              <p className="form-hint">{form.title.length}/300 characters</p>
            </div>

            <div className="form-group">
              <label className="form-label">Description <span className="req">*</span></label>
              <textarea className="form-textarea" rows={7}
                placeholder="Describe the issue in detail — what happened, when, which systems are affected, steps to reproduce…"
                value={form.description}
                onChange={e => { set('description', e.target.value); setErrs(v=>({...v,description:''})); }} />
              {errs.description && <p className="form-error">{errs.description}</p>}
            </div>
          </div>
        </div>

        {}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">⚙️ Classification</div>
          </div>
          <div className="card-body">
            <div className="form-row">
              {}
              <div className="form-group">
                <label className="form-label">Priority <span className="req">*</span></label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {PRIORITIES.map(p => {
                    const m   = PRIORITY_META[p];
                    const sel = form.priority === p;
                    return (
                      <button key={p} type="button"
                        className={`priority-card ${sel ? 'selected' : ''}`}
                        style={{
                          borderColor: sel ? m.color : 'var(--border)',
                          background:  sel ? m.bg    : 'var(--surface)',
                          boxShadow:   sel ? `0 2px 8px ${m.color}30` : 'none',
                        }}
                        onClick={() => set('priority', p)}>
                        <div className="priority-card-title" style={{ color: m.color }}>
                          {m.icon} {p}
                        </div>
                        <div className="priority-card-desc">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {}
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.categoryId}
                  onChange={e => set('categoryId', e.target.value)}>
                  <option value="">— Select category (optional) —</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
                </select>
                <p className="form-hint">Helps route to the correct team faster</p>

                {}
                {form.priority && (
                  <div style={{
                    marginTop: 16, padding:'12px 14px', borderRadius:'var(--r-sm)',
                    background: pm.bg, border: `1px solid ${pm.color}30`,
                  }}>
                    <div style={{ fontWeight:700, color: pm.color, fontSize:13, marginBottom:4 }}>
                      {pm.icon} {form.priority} — SLA Targets
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-s)', lineHeight:1.7 }}>
                      {pm.sla.split(' · ').map((s,i) => <div key={i}>• {s}</div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><Spinner size="spinner-sm" /> Submitting…</> : '🚀 Submit Incident'}
          </button>
        </div>
      </form>
    </div>
  );
}
