import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notifAPI } from '../../api';
import { Avatar } from '../common';

function NavItem({ to, icon, label, badge, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <span style={{ fontSize:16, width:20, textAlign:'center', flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
    </NavLink>
  );
}

function Bell({ count, onClick }) {
  return (
    <button className="btn btn-secondary btn-sm" onClick={onClick} style={{ position:'relative', padding:'6px 12px' }}>
      🔔
      {count > 0 && (
        <span style={{
          position:'absolute', top:-4, right:-4,
          background:'var(--red-600)', color:'#fff',
          borderRadius:'50%', fontSize:10, fontWeight:700,
          width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center',
          lineHeight:1,
        }}>{count > 99 ? '99+' : count}</span>
      )}
    </button>
  );
}

export default function AppLayout() {
  const { user, logout, isAdmin, isReporter, isResolver, isManager } = useAuth();
  const navigate = useNavigate();
  const [unread,    setUnread]    = useState(0);
  const [notifs,    setNotifs]    = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const poll = () => notifAPI.unreadCount().then(r => setUnread(r.data.data || 0)).catch(() => {});
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);

  const handleBell = async () => {
    if (!showNotif) {
      try {
        const r = await notifAPI.list();
        setNotifs(r.data.data || []);
        if (unread > 0) { await notifAPI.markAllRead(); setUnread(0); }
      } catch {}
    }
    setShowNotif(v => !v);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleLabel = {
    ADMIN: 'Administrator',
    REPORTER: 'End User',
    RESOLVER: 'Support Engineer',
    INC_MANAGER: 'Incident Manager',
  };

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-mark">IMS</div>
          <div className="sb-logo-text">
            <div className="title">IMS Portal</div>
            <div className="sub">Incident Mgmt System</div>
          </div>
        </div>

        <div className="sb-role">{roleLabel[user?.roleCode] || user?.roleCode}</div>

        {/* ADMIN navigation */}
        {isAdmin && <>
          <div className="nav-group">
            <div className="nav-group-label">Overview</div>
            <NavItem to="/app/dashboard" icon="📊" label="Dashboard" end />
          </div>
          <div className="nav-group">
            <div className="nav-group-label">Governance</div>
            <NavItem to="/app/admin/users"      icon="👥" label="User Management" />
            <NavItem to="/app/admin/slas"        icon="⏱️" label="SLA Configuration" />
            <NavItem to="/app/admin/categories"  icon="🗂️" label="Categories" />
            <NavItem to="/app/admin/audit"       icon="📋" label="Audit Logs" />
          </div>
          <div className="nav-group">
            <div className="nav-group-label">Analytics</div>
            <NavItem to="/app/reports" icon="📊" label="Reports" />
          </div>
        </>}

        {/* REPORTER navigation */}
        {isReporter && <>
          <div className="nav-group">
            <div className="nav-group-label">My Work</div>
            <NavItem to="/app/dashboard"     icon="🏠" label="Dashboard" end />
            <NavItem to="/app/incidents/my"  icon="📋" label="My Incidents" />
            <NavItem to="/app/incidents/new" icon="➕" label="Raise Incident" />
          </div>
        </>}

        {/* RESOLVER navigation */}
        {isResolver && <>
          <div className="nav-group">
            <div className="nav-group-label">My Work</div>
            <NavItem to="/app/dashboard"    icon="🏠" label="Dashboard" end />
            <NavItem to="/app/incidents"    icon="📋" label="All Incidents" />
            <NavItem to="/app/incidents/my" icon="🔧" label="Assigned to Me" />
          </div>
          <div className="nav-group">
            <div className="nav-group-label">Analytics</div>
            <NavItem to="/app/reports" icon="📊" label="Reports" />
          </div>
        </>}

        {/* MANAGER navigation */}
        {isManager && <>
          <div className="nav-group">
            <div className="nav-group-label">Operations</div>
            <NavItem to="/app/dashboard"         icon="🏠" label="Dashboard" end />
            <NavItem to="/app/incidents"          icon="📋" label="Incident Queue" />
            <NavItem to="/app/admin/categories"   icon="🗂️" label="Categories" />
          </div>
          <div className="nav-group">
            <div className="nav-group-label">Monitoring</div>
            <NavItem to="/app/manager/sla"         icon="⏱️" label="SLA Monitor" />
            <NavItem to="/app/manager/escalations" icon="🔺" label="Escalations" />
          </div>
          <div className="nav-group">
            <div className="nav-group-label">Analytics</div>
            <NavItem to="/app/reports" icon="📊" label="Reports" />
          </div>
        </>}

        {/* Common — all roles */}
        <div className="nav-group">
          <div className="nav-group-label">Account</div>
          <NavItem to="/app/notifications" icon="🔔" label="Notifications" badge={unread} />
          <NavItem to="/app/profile"       icon="👤" label="My Profile" />
        </div>

        <div className="sb-footer">
          <div className="sb-user" onClick={() => navigate('/app/profile')} title="My Profile">
            <Avatar name={user?.fullName || user?.username} size="avatar-sm" />
            <div style={{ overflow:'hidden', flex:1 }}>
              <div className="sb-user-name">{user?.fullName || user?.username}</div>
              <div className="sb-user-role">{roleLabel[user?.roleCode]}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            style={{ width:'100%', marginTop:6, fontSize:12, color:'var(--text-m)' }}
            title="Logout">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        <header className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Avatar name={user?.fullName || user?.username} size="avatar-sm" />
            <div style={{ lineHeight:1.3 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>
                {user?.fullName || user?.username}
              </div>
              <div style={{ fontSize:11, color:'var(--text-m)' }}>{user?.email}</div>
            </div>
          </div>
          <div className="topbar-right">
            <Bell count={unread} onClick={handleBell} />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/app/profile')}>
              👤 Profile
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </header>

        {/* Notification Dropdown */}
        {showNotif && (
          <div className="notif-dropdown">
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, fontSize:14 }}>🔔 Notifications</span>
              <div style={{ display:'flex', gap:6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize:11 }}
                  onClick={() => { navigate('/app/notifications'); setShowNotif(false); }}>
                  View All
                </button>
                <button className="btn-icon" onClick={() => setShowNotif(false)}>✕</button>
              </div>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {notifs.length === 0
                ? <p style={{ padding:28, textAlign:'center', color:'var(--text-m)', fontSize:13 }}>All caught up! 🎉</p>
                : notifs.slice(0, 25).map(n => (
                    <div key={n.notificationId}
                      className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                      onClick={() => {
                        if (n.incidentId) {
                          navigate(`/app/incidents/${n.incidentId}`);
                          setShowNotif(false);
                        }
                      }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{n.title}</div>
                      <div style={{ fontSize:12, color:'var(--text-m)', marginTop:2, lineHeight:1.5 }}>{n.message}</div>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
