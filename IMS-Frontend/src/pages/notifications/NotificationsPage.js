import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifAPI } from '../../api';
import { PageLoader, EmptyState, useToast, ToastStack, PageHeader } from '../../components/common';
import { fmtAgo } from '../../utils/helpers';

const TYPE_META = {
  INCIDENT_ASSIGNED:{ icon:'👤', color:'#2563eb', bg:'#eff6ff' },
  STATUS_CHANGED:   { icon:'⚡', color:'#d97706', bg:'#fffbeb' },
  SLA_BREACH:       { icon:'🚨', color:'#dc2626', bg:'#fef2f2' },
  COMMENT_ADDED:    { icon:'💬', color:'#7c3aed', bg:'#faf5ff' },
  ESCALATION:       { icon:'🔺', color:'#9d174d', bg:'#fdf4ff' },
  GENERAL:          { icon:'ℹ️', color:'#0891b2', bg:'#ecfeff' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [notifs,   setNotifs]  = useState([]);
  const [loading,  setLoad]    = useState(true);
  const [filter,   setFilter]  = useState('all'); // all | unread

  useEffect(() => {
    (async () => {
      try {
        const r = await notifAPI.list();
        setNotifs(r.data.data || []);
      } catch { toast.error('Failed to load notifications'); }
      finally { setLoad(false); }
    })();
  }, []);

  const markAll = async () => {
    try {
      await notifAPI.markAllRead();
      setNotifs(n => n.map(x => ({ ...x, isRead: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const markOne = async id => {
    try {
      await notifAPI.markRead(id);
      setNotifs(n => n.map(x => x.notificationId === id ? { ...x, isRead: true } : x));
    } catch {}
  };

  const displayed = filter === 'unread' ? notifs.filter(n => !n.isRead) : notifs;
  const unreadCnt = notifs.filter(n => !n.isRead).length;

  if (loading) return <PageLoader text="Loading notifications…" />;

  return (
    <div className="anim-in" style={{ maxWidth: 760, margin:'0 auto' }}>
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title="🔔 Notifications"
        sub={`${unreadCnt} unread of ${notifs.length} total`}
        actions={<>
          {unreadCnt > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={markAll}>
              ✓ Mark all as read
            </button>
          )}
        </>}
      />

      {}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {[['all','All'],['unread',`Unread (${unreadCnt})`]].map(([v,l]) => (
          <button key={v} className={`btn btn-sm ${filter===v?'btn-primary':'btn-secondary'}`}
            onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="card">
          <EmptyState icon="🎉" title="All caught up!" sub="No notifications to show." />
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {displayed.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.GENERAL;
            return (
              <div key={n.notificationId}
                style={{
                  background: n.isRead ? 'var(--surface)' : meta.bg,
                  border: `1px solid ${n.isRead ? 'var(--border)' : meta.color}30`,
                  borderRadius:'var(--r)', padding:'14px 16px',
                  cursor: n.incidentId ? 'pointer' : 'default',
                  transition:'box-shadow .15s',
                  boxShadow: n.isRead ? 'var(--shadow-xs)' : 'var(--shadow-sm)',
                  display:'flex', alignItems:'flex-start', gap:12,
                }}
                onClick={() => { if (n.incidentId) { navigate(`/app/incidents/${n.incidentId}`); markOne(n.notificationId); } }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  background:`${meta.color}18`, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  fontSize:18, flexShrink:0,
                }}>
                  {meta.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                    <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize:14, color:'var(--text)' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-m)', whiteSpace:'nowrap', flexShrink:0 }}>
                      {fmtAgo(n.createdAt)}
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-s)', marginTop:3, lineHeight:1.5 }}>
                    {n.message}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                    <span style={{
                      fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em',
                      color: meta.color, background:`${meta.color}18`,
                      padding:'2px 8px', borderRadius:'var(--r-full)',
                    }}>
                      {n.type?.replace(/_/g,' ')}
                    </span>
                    {n.incidentId && (
                      <span style={{ fontSize:11, color:'var(--blue-600)', fontWeight:600 }}>
                        Incident #{n.incidentId} →
                      </span>
                    )}
                    {!n.isRead && (
                      <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', fontSize:11 }}
                        onClick={e => { e.stopPropagation(); markOne(n.notificationId); }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
