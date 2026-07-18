import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { incidentAPI, usersAPI } from '../../api';
import {
  StatusBadge, PriorityBadge, Avatar, PageLoader, Alert, Modal,
  Spinner, CommentBubble, TLItem, DF, useToast, ToastStack,
} from '../../components/common';
import { fmtDt, fmtAgo, apiErr } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function IncidentDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isReporter, isResolver, isManager, isAdmin } = useAuth();
  const toast = useToast();

  const [inc,     setInc]  = useState(null);
  const [loading, setLoad] = useState(true);
  const [comment,    setComment] = useState('');
  const [isInternal, setIsInt]   = useState(false);
  const [posting,    setPosting] = useState(false);
  const [showAssign,  setSA]  = useState(false);
  const [resolvers,   setRes] = useState([]);
  const [resLoading,  setRL]  = useState(false);
  const [assignOwner, setAO]  = useState('');
  const [assignNote,  setAN]  = useState('');
  const [assignGroup, setAG]  = useState('');
  const [assignBusy,  setAB]  = useState(false);
  const [showStatus, setSS]  = useState(false);
  const [newStatus,  setNS]  = useState('');
  const [statusNote, setSN]  = useState('');
  const [resNotes,   setRN]  = useState('');
  const [rootCause,  setRC]  = useState('');
  const [statusBusy, setSTB] = useState(false);

  const load = async () => {
    setLoad(true);
    try { const r = await incidentAPI.getById(id); setInc(r.data.data); }
    catch { toast.error('Failed to load incident'); }
    finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [id]);

  const openAssign = async () => {
    setSA(true);
    setRL(true);
    setRes([]);
    setAO('');
    try {
      const r = await usersAPI.byRole('RESOLVER');
      const resolverList = r.data.data || [];
      setRes(resolverList);
      if (resolverList.length === 0) {
        toast.info('No resolvers found. Ask admin to create resolver accounts.');
      }
    } catch (e) {
      toast.error('Failed to load resolvers: ' + apiErr(e));
    } finally {
      setRL(false);
    }
  };

  const doAssign = async () => {
    if (!assignOwner) { toast.error('Please select a resolver'); return; }
    setAB(true);
    try {
      await incidentAPI.assign(id, {
        ownerId:       Number(assignOwner),
        note:          assignNote   || undefined,
        assignedGroup: assignGroup  || undefined,
      });
      toast.success('Incident assigned successfully');
      setSA(false); setAO(''); setAN(''); setAG(''); load();
    } catch (e) { toast.error(apiErr(e)); }
    finally     { setAB(false); }
  };

  const doStatus = async () => {
    if (!newStatus) { toast.error('Please select a new status'); return; }
    if (newStatus === 'RESOLVED' && !resNotes.trim()) {
      toast.error('Resolution summary is required when resolving an incident');
      return;
    }
    setSTB(true);
    try {
      await incidentAPI.changeStatus(id, {
        newStatus,
        note:            statusNote || undefined,
        resolutionNotes: resNotes   || undefined,
        rootCause:       rootCause  || undefined,
      });
      toast.success('Status updated successfully');
      setSS(false); setNS(''); setSN(''); setRN(''); setRC(''); load();
    } catch (e) { toast.error(apiErr(e)); }
    finally     { setSTB(false); }
  };

  const doComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await incidentAPI.addComment(id, { commentText: comment.trim(), isInternal });
      toast.success('Comment added'); setComment(''); setIsInt(false); load();
    } catch { toast.error('Failed to post comment'); }
    finally { setPosting(false); }
  };

  const allowedStatuses = () => {
    if (isManager || isAdmin) {
      const s = inc?.status;
      if (s === 'CLOSED') return ['REOPENED'];
      if (s === 'RESOLVED') return ['CLOSED', 'REOPENED'];
      return ['LOGGED', 'CATEGORIZED', 'ESCALATED', 'CLOSED', 'REOPENED'];
    }
    if (isResolver) {
      const s = inc?.status;
      if (s === 'ASSIGNED')    return ['IN_PROGRESS'];
      if (s === 'IN_PROGRESS') return ['RESOLVED'];
      if (s === 'REOPENED')    return ['IN_PROGRESS'];
      return [];
    }
    return [];
  };

  if (loading) return <PageLoader text="Loading incident…" />;
  if (!inc)    return <div style={{ padding:40, textAlign:'center', color:'var(--text-m)' }}>Incident not found.</div>;

  const canAssign = (isManager || isAdmin) && !['CLOSED', 'REOPENED'].includes(inc.status);
  const canStatus = (isResolver || isManager || isAdmin) && allowedStatuses().length > 0;

  return (
    <div className="anim-in">
      <ToastStack toasts={toast.toasts} />

      {location.state?.created && (
        <Alert type="success" onClose={() => window.history.replaceState({}, '')}>
          ✅ Incident #{id} submitted successfully! SLA clock has started.
        </Alert>
      )}

      <div style={{ marginBottom:16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
      </div>

      {}
      <div className="page-header">
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            <span className="td-link" style={{ fontSize:15, pointerEvents:'none' }}>#{inc.incidentId}</span>
            <StatusBadge  status={inc.status} />
            <PriorityBadge priority={inc.priority} />
            {inc.slaBreach && <span className="badge sla-breach">⚠️ SLA Breached</span>}
          </div>
          <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-.4px', lineHeight:1.35, marginBottom:8 }}>
            {inc.title}
          </h1>
          <p style={{ fontSize:13, color:'var(--text-m)' }}>
            Raised by <strong style={{ color:'var(--text-s)' }}>{inc.createdByName}</strong> · {fmtAgo(inc.createdAt)}
          </p>
        </div>
        <div className="page-actions">
          {canAssign && (
            <button className="btn btn-primary btn-sm" onClick={openAssign}>
              👤 Assign
            </button>
          )}
          {canStatus && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSS(true); setNS(''); }}>
              ⚡ Change Status
            </button>
          )}
        </div>
      </div>

      {}
      <div className="grid-sidebar-lg" style={{ gap:20 }}>
        {}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {}
          <div className="card">
            <div className="card-header"><div className="card-title">📄 Description</div></div>
            <div className="card-body" style={{ whiteSpace:'pre-wrap', lineHeight:1.8, color:'var(--text-s)', fontSize:14 }}>
              {inc.description}
            </div>
          </div>

          {}
          {inc.resolutionNotes && (
            <div className="card" style={{ borderColor:'#86efac' }}>
              <div className="card-header" style={{ background:'var(--green-50)', borderRadius:'var(--r) var(--r) 0 0' }}>
                <div className="card-title" style={{ color:'var(--green-800)' }}>✅ Resolution Summary</div>
              </div>
              <div className="card-body">
                <p style={{ whiteSpace:'pre-wrap', lineHeight:1.8, fontSize:14 }}>{inc.resolutionNotes}</p>
                {inc.rootCause && <>
                  <hr className="divider" />
                  <div className="detail-label" style={{ marginBottom:8 }}>Root Cause Analysis</div>
                  <p style={{ lineHeight:1.8, color:'var(--text-s)', fontSize:14 }}>{inc.rootCause}</p>
                </>}
              </div>
            </div>
          )}

          {}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📜 Activity Timeline</div>
              <span style={{ fontSize:12, color:'var(--text-m)' }}>{inc.history?.length || 0} events</span>
            </div>
            <div className="card-body">
              {(inc.history || []).length > 0 ? (
                <div className="timeline">
                  {inc.history.map(h => <TLItem key={h.historyId} {...h} />)}
                </div>
              ) : (
                <p style={{ color:'var(--text-m)', fontSize:13 }}>No history recorded yet.</p>
              )}
            </div>
          </div>

          {}
          <div className="card">
            <div className="card-header">
              <div className="card-title">💬 Comments & Work Notes</div>
              <span style={{ fontSize:12, color:'var(--text-m)' }}>{inc.comments?.length || 0} comments</span>
            </div>
            <div className="card-body">
              {(inc.comments || []).length === 0 ? (
                <p style={{ color:'var(--text-m)', fontSize:13, marginBottom:16 }}>No comments yet. Be the first!</p>
              ) : (
                inc.comments.map(c => <CommentBubble key={c.commentId} c={c} />)
              )}

              <div className="comment-compose">
                <Avatar name={user?.fullName} size="avatar-sm" />
                <div style={{ flex:1 }}>
                  <textarea className="form-textarea" rows={3}
                    placeholder="Add a comment or work note…"
                    value={comment}
                    onChange={e => setComment(e.target.value)} />
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
                    {(isResolver || isManager || isAdmin) && (
                      <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer', color:'var(--text-s)' }}>
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInt(e.target.checked)} />
                        Internal note <span style={{ fontSize:11, color:'var(--text-m)' }}>(hidden from reporter)</span>
                      </label>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginLeft:'auto' }}
                      onClick={doComment}
                      disabled={!comment.trim() || posting}>
                      {posting ? <><Spinner size="spinner-sm" /> Posting…</> : '➤ Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">ℹ️ Incident Details</div></div>
            <div className="card-body-sm">
              <DF label="Incident ID"    value={`#${inc.incidentId}`} mono />
              <DF label="Status"         value={<StatusBadge status={inc.status} />} />
              <DF label="Priority"       value={<PriorityBadge priority={inc.priority} />} />
              <DF label="Category"       value={inc.categoryName} />
              <DF label="Assigned To"    value={inc.ownerName} />
              <DF label="Assigned Group" value={inc.assignedGroup} />
              <DF label="Reporter"       value={inc.createdByName} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">📅 Timestamps</div></div>
            <div className="card-body-sm">
              <DF label="Created"  value={fmtDt(inc.createdAt)} />
              <DF label="Updated"  value={fmtDt(inc.updatedAt)} />
              {inc.resolvedAt && <DF label="Resolved" value={fmtDt(inc.resolvedAt)} />}
              {inc.closedAt   && <DF label="Closed"   value={fmtDt(inc.closedAt)} />}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">⏱️ SLA Status</div></div>
            <div className="card-body-sm">
              {inc.slaResponseDue ? (
                <>
                  <DF label="Response Due"   value={fmtDt(inc.slaResponseDue)} />
                  <DF label="Resolution Due" value={fmtDt(inc.slaResolutionDue)} />
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
                    <span className={`badge ${inc.responseBreached   ? 'sla-breach' : 'sla-ok'}`}>
                      Response: {inc.responseBreached   ? '⚠️ Breached' : '✓ Within SLA'}
                    </span>
                    <span className={`badge ${inc.resolutionBreached ? 'sla-breach' : 'sla-ok'}`}>
                      Resolution: {inc.resolutionBreached ? '⚠️ Breached' : '✓ Within SLA'}
                    </span>
                  </div>
                </>
              ) : (
                <p style={{ fontSize:13, color:'var(--text-m)' }}>No SLA record attached.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {}
      <Modal open={showAssign} onClose={() => setSA(false)} title="👤 Assign Incident to Resolver" size="modal-md"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setSA(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={doAssign} disabled={assignBusy || resLoading}>
            {assignBusy ? <><Spinner size="spinner-sm" />Assigning…</> : 'Assign Incident'}
          </button>
        </>}>
        <div className="form-group">
          <label className="form-label">Resolver <span className="req">*</span></label>
          {resLoading ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', color:'var(--text-m)' }}>
              <Spinner size="spinner-sm" /> Loading resolvers…
            </div>
          ) : (
            <select className="form-select" value={assignOwner} onChange={e => setAO(e.target.value)}>
              <option value="">— Choose a resolver —</option>
              {resolvers.map(r => (
                <option key={r.userId} value={r.userId}>
                  {r.fullName || r.username} — {r.email}
                </option>
              ))}
            </select>
          )}
          {!resLoading && resolvers.length === 0 && (
            <div style={{ marginTop:8, padding:'10px 12px', background:'var(--yellow-50)', border:'1px solid var(--yellow-100)', borderRadius:'var(--r-sm)', fontSize:13, color:'var(--yellow-800)' }}>
              ⚠️ No resolver accounts found. Ask the Admin to create users with the Support Engineer role.
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Assignment Group</label>
          <input className="form-input" placeholder="e.g. Network Team, Infra Team"
            value={assignGroup} onChange={e => setAG(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Assignment Note</label>
          <textarea className="form-textarea" rows={3}
            placeholder="Optional instructions for the resolver…"
            value={assignNote} onChange={e => setAN(e.target.value)} />
        </div>
      </Modal>

      { }
      <Modal open={showStatus} onClose={() => setSS(false)} title="⚡ Change Incident Status" size="modal-md"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setSS(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={doStatus} disabled={statusBusy}>
            {statusBusy ? <><Spinner size="spinner-sm" />Updating…</> : 'Update Status'}
          </button>
        </>}>
        <div className="form-group">
          <label className="form-label">New Status <span className="req">*</span></label>
          <select className="form-select" value={newStatus} onChange={e => setNS(e.target.value)}>
            <option value="">— Select new status —</option>
            {allowedStatuses().map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <p className="form-hint">
            Current status: <strong style={{ color:'var(--text-s)' }}>{inc.status.replace('_', ' ')}</strong>
            {isManager && inc.status === 'CLOSED' && (
              <span style={{ color:'var(--blue-600)', marginLeft:8, fontWeight:600 }}>
                — You can reopen this closed incident
              </span>
            )}
            {isManager && inc.status === 'RESOLVED' && (
              <span style={{ color:'var(--text-m)', marginLeft:8 }}>
                — You can close (approve) or reopen (reject resolution)
              </span>
            )}
            {isManager && !['CLOSED','RESOLVED'].includes(inc.status) && (
              <span style={{ color:'var(--text-m)', marginLeft:8 }}>
                — You can log, categorize, escalate, close or reopen
              </span>
            )}
            {isResolver && <span style={{ color:'var(--text-m)', marginLeft:8 }}>— You can start work or mark resolved</span>}
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Note / Reason</label>
          <textarea className="form-textarea" rows={3}
            placeholder="Reason for this status change…"
            value={statusNote} onChange={e => setSN(e.target.value)} />
        </div>

        {newStatus === 'RESOLVED' && <>
          <hr className="divider" />
          <div className="form-group">
            <label className="form-label">Resolution Summary <span className="req">*</span></label>
            <textarea className="form-textarea" rows={4}
              placeholder="Describe exactly how the incident was resolved — steps taken, fix applied, systems restored…"
              value={resNotes} onChange={e => setRN(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Root Cause Analysis</label>
            <textarea className="form-textarea" rows={3}
              placeholder="What was the root cause of this incident?"
              value={rootCause} onChange={e => setRC(e.target.value)} />
          </div>
        </>}

        {newStatus === 'REOPENED' && (
          <div style={{
            marginTop:12, padding:'12px 16px',
            background:'#fff7ed', border:'1px solid #fed7aa',
            borderRadius:'var(--r-sm)', fontSize:13, color:'#92400e',
            lineHeight:1.6
          }}>
            <strong>🔁 Reopening this incident</strong> will change its status back to <strong>REOPENED</strong>
            and notify the resolver. A reason is recommended so the team understands why the resolution was unsatisfactory.
          </div>
        )}

        {newStatus === 'CLOSED' && (
          <div style={{
            marginTop:12, padding:'12px 16px',
            background:'#f0fdf4', border:'1px solid #bbf7d0',
            borderRadius:'var(--r-sm)', fontSize:13, color:'#166534',
            lineHeight:1.6
          }}>
            <strong>✅ Closing this incident</strong> marks it as complete and archives it.
            Incidents can still be reopened after closing if the issue re-occurs.
          </div>
        )}
      </Modal>
    </div>
  );
}
