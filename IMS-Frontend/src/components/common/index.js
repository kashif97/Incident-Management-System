import React, { useState } from 'react';
import { initials, avatarBg, fmtAgo, STATUS_LABEL, STATUS_DOT } from '../../utils/helpers';

export function Avatar({ name, size='' }) {
  return <div className={`avatar ${size}`} style={{background:avatarBg(name)}}>{initials(name)}</div>;
}


export function StatusBadge({ status }) {
  return <span className={`badge s-${status}`}>{STATUS_LABEL[status]||status}</span>;
}


export function PriorityBadge({ priority }) {
  const icons={LOW:'🟢',MEDIUM:'🟡',HIGH:'🟠',CRITICAL:'🔴'};
  return <span className={`badge p-${priority}`}>{icons[priority]} {priority}</span>;
}


export function RoleBadge({ role }) {
  const labels={ADMIN:'Admin',REPORTER:'End User',RESOLVER:'Support Eng.',INC_MANAGER:'Inc. Manager'};
  return <span className={`badge r-${role}`}>{labels[role]||role}</span>;
}


export function Spinner({ size='' }) { return <div className={`spinner ${size}`} />; }


export function PageLoader({ text='Loading...' }) {
  return <div className="page-loader"><div className="spinner spinner-lg"/><span>{text}</span></div>;
}


export function EmptyState({ icon='📭', title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <p className="empty-sub">{sub}</p>}
      {action && <div style={{marginTop:18}}>{action}</div>}
    </div>
  );
}


export function Alert({ type='info', children, onClose }) {
  const icons={danger:'⚠️',success:'✅',warning:'⚠️',info:'ℹ️'};
  return (
    <div className={`alert alert-${type}`}>
      <span style={{flexShrink:0}}>{icons[type]}</span>
      <div style={{flex:1}}>{children}</div>
      {onClose && <button className="btn-icon" onClick={onClose} style={{marginLeft:'auto',flexShrink:0}}>✕</button>}
    </div>
  );
}


export function Modal({ open, onClose, title, children, footer, size='' }) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel='Confirm', variant='danger', loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>Cancel</button>
        <button className={`btn btn-${variant} btn-sm`} onClick={onConfirm} disabled={loading}>
          {loading ? <><Spinner size="spinner-sm"/> Working…</> : confirmLabel}
        </button>
      </>}>
      <p style={{color:'var(--text-s)',lineHeight:1.7,fontSize:14}}>{message}</p>
    </Modal>
  );
}


export function KpiCard({ label, value, icon, color='var(--primary)', sub, onClick }) {
  return (
    <div className="kpi-card" style={{cursor:onClick?'pointer':'default'}} onClick={onClick}>
      <div className="kpi-card-accent" style={{background:color}}/>
      <span className="kpi-icon">{icon}</span>
      <div className="kpi-value">{value ?? '—'}</div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}


export function useToast() {
  const [toasts, set] = useState([]);
  const push = (msg, type='success') => {
    const id = Date.now()+Math.random();
    set(t=>[...t,{id,msg,type}]);
    setTimeout(()=>set(t=>t.filter(x=>x.id!==id)),3500);
  };
  return { toasts, success:m=>push(m,'success'), error:m=>push(m,'error'), info:m=>push(m,'info'), warn:m=>push(m,'warning') };
}
export function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  const icons={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
  return (
    <div className="toast-stack">
      {toasts.map(t=>(
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type]}</span>{t.msg}
        </div>
      ))}
    </div>
  );
}


export function Pagination({ page, total, totalPages, size=20, onPage }) {
  if (totalPages<=1) return null;
  const from = page*size+1, to = Math.min((page+1)*size, total);
  return (
    <div className="pagination">
      <span className="pagination-info">Showing {from}–{to} of {total}</span>
      <div className="pagination-btns">
        <button className="btn btn-secondary btn-sm" onClick={()=>onPage(page-1)} disabled={page===0}>← Prev</button>
        {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
          let p = i;
          if (totalPages>7) { if(i<3) p=i; else if(i===3) return <span key="e" style={{padding:'0 4px',color:'var(--text-m)'}}>…</span>; else p=totalPages-7+i; }
          return <button key={p} className={`btn btn-sm ${p===page?'btn-primary':'btn-secondary'}`} onClick={()=>onPage(p)}>{p+1}</button>;
        })}
        <button className="btn btn-secondary btn-sm" onClick={()=>onPage(page+1)} disabled={page>=totalPages-1}>Next →</button>
      </div>
    </div>
  );
}


export function DF({ label, value, mono }) {
  return (
    <div className="detail-field">
      <div className="detail-label">{label}</div>
      <div className={`detail-value${mono?' font-mono':''}`} style={{fontSize:mono?12:undefined}}>{value||'—'}</div>
    </div>
  );
}


export function TLItem({ status, changedByName, changeNote, changedAt }) {
  const statusLabels = {
    NEW:'Incident Raised', LOGGED:'Logged & Validated',
    CATEGORIZED:'Categorized & Prioritized', ASSIGNED:'Assigned to Resolver',
    IN_PROGRESS:'Work Started', RESOLVED:'Resolved',
    CLOSED:'Closed', REOPENED:'Reopened', ESCALATED:'Escalated',
  };
  return (
    <div className="tl-item">
      <div className={`tl-dot ${STATUS_DOT[status]||''}`}/>
      <div className="tl-title">{statusLabels[status]||status}</div>
      <div className="tl-meta">by <strong>{changedByName}</strong> · {fmtAgo(changedAt)}</div>
      {changeNote && <div className="tl-note">{changeNote}</div>}
    </div>
  );
}

export function CommentBubble({ c }) {
  return (
    <div className={`comment-wrap ${c.isInternal?'comment-internal':''}`}>
      <Avatar name={c.commentedByName} size="avatar-sm"/>
      <div className="comment-bubble">
        <div className="comment-meta">
          <strong>{c.commentedByName}</strong>
          {c.isInternal && <span className="badge s-ASSIGNED" style={{marginLeft:6,fontSize:10}}>Internal</span>}
          {' · '}{fmtAgo(c.commentedAt)}
        </div>
        <div className="comment-text">{c.commentText}</div>
      </div>
    </div>
  );
}


export function Bell({ count, onClick }) {
  return (
    <button className="bell-btn" onClick={onClick}>
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
      {count>0 && <span className="bell-dot"/>}
    </button>
  );
}

export function PageHeader({ title, sub, actions }) {
  return (
    <div className="page-header">
      <div><h1 className="page-title">{title}</h1>{sub&&<p className="page-sub">{sub}</p>}</div>
      {actions&&<div className="page-actions">{actions}</div>}
    </div>
  );
}
