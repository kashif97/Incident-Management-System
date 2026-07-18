import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { incidentAPI } from '../../api';
import { KpiCard, PageLoader, StatusBadge, PriorityBadge, EmptyState } from '../../components/common';
import { fmtAgo } from '../../utils/helpers';

const BAR_COLORS = ['#2563eb','#7c3aed','#d97706','#16a34a','#dc2626','#0891b2','#9d174d','#475569'];

export default function DashboardPage() {
  const { user, isAdmin, isReporter, isResolver, isManager } = useAuth();
  const navigate  = useNavigate();
  const [kpi,     setKpi]    = useState(null);
  const [recent,  setRecent] = useState([]);
  const [loading, setLoad]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [kr, ir] = await Promise.all([
          incidentAPI.kpi(),
          isReporter
            ? incidentAPI.myList({ page:0, size:6 })
            : incidentAPI.list({ page:0, size:6 }),
        ]);
        setKpi(kr.data.data);
        setRecent(ir.data.data?.content || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoad(false);
      }
    })();
  }, [isReporter]);

  if (loading) return <PageLoader text="Loading dashboard…" />;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const barData = [
    { name:'New',         value: kpi?.newIncidents        || 0 },
    { name:'Open',        value: kpi?.openIncidents       || 0 },
    { name:'In Progress', value: kpi?.inProgressIncidents || 0 },
    { name:'Resolved',    value: kpi?.resolvedIncidents   || 0 },
    { name:'Closed',      value: kpi?.closedIncidents     || 0 },
    { name:'Escalated',   value: kpi?.escalatedIncidents  || 0 },
  ];
  const pieData = barData.filter(d => d.value > 0);

  const roleDesc = {
    ADMIN:       'System governance overview. All metrics are read-only for administrators.',
    REPORTER:    'Track your submitted incidents and their current resolution status.',
    RESOLVER:    'View incidents assigned to you and work on resolving them.',
    INC_MANAGER: 'Monitor all incidents, assign to resolvers, escalate and close.',
  };

  return (
    <div className="anim-in">
      {}
      <div style={{
        background: 'linear-gradient(135deg,#1e40af 0%,#2563eb 50%,#1d4ed8 100%)',
        borderRadius: 'var(--r-lg)', padding:'28px 32px', marginBottom:24,
        color:'#fff', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', right:-40, top:-40, width:220, height:220, background:'rgba(255,255,255,.05)', borderRadius:'50%', pointerEvents:'none' }} />
        <p style={{ fontSize:13, opacity:.8, marginBottom:4 }}>{greeting},</p>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-.5px', marginBottom:8 }}>
          {user?.fullName || user?.username} 👋
        </h1>
        <p style={{ fontSize:13, opacity:.75, maxWidth:500 }}>
          {roleDesc[user?.roleCode] || ''}
        </p>
        <div style={{ marginTop:16, display:'flex', gap:10 }}>
          {}
          {isReporter && <>
            <button className="btn btn-sm"
              style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.2)' }}
              onClick={() => navigate('/app/incidents/my')}>
              📋 My Incidents
            </button>
            <button className="btn btn-sm"
              style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.15)' }}
              onClick={() => navigate('/app/incidents/new')}>
              ➕ Raise Incident
            </button>
          </>}
          {}
          {isResolver && <>
            <button className="btn btn-sm"
              style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.2)' }}
              onClick={() => navigate('/app/incidents')}>
              📋 All Incidents
            </button>
            <button className="btn btn-sm"
              style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.15)' }}
              onClick={() => navigate('/app/incidents/my')}>
              🔧 Assigned to Me
            </button>
          </>}
          {}
          {isManager && <>
            <button className="btn btn-sm"
              style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.2)' }}
              onClick={() => navigate('/app/incidents')}>
              📋 Incident Queue
            </button>
            <button className="btn btn-sm"
              style={{ background:'rgba(255,255,255,.1)', color:'#fff', border:'1px solid rgba(255,255,255,.15)' }}
              onClick={() => navigate('/app/manager/sla')}>
              ⏱️ SLA Monitor
            </button>
          </>}
        </div>
      </div>

      {}
      <div className="kpi-grid">
        <KpiCard label="Total Incidents"  value={kpi?.totalIncidents}       icon="📋" color="#2563eb" />
        <KpiCard label="Open"             value={kpi?.openIncidents}        icon="🔓" color="#d97706" sub="New + Logged + Categorized" />
        <KpiCard label="In Progress"      value={kpi?.inProgressIncidents}  icon="⚡" color="#2563eb" />
        <KpiCard label="SLA Breaches"     value={kpi?.slaBreaches}          icon="🚨" color="#dc2626" />
        <KpiCard label="Resolved"         value={kpi?.resolvedIncidents}    icon="✅" color="#16a34a" />
        <KpiCard label="Closed"           value={kpi?.closedIncidents}      icon="🔒" color="#475569" />
        <KpiCard label="Escalated"        value={kpi?.escalatedIncidents}   icon="🔺" color="#9d174d" />
        {isAdmin
          ? <KpiCard label="Total Users" value={kpi?.totalUsers}        icon="👥" color="#0891b2" sub={`${kpi?.activeUsers || 0} active`} />
          : <KpiCard label="My Open"     value={kpi?.myOpenIncidents}   icon="🎯" color="#7c3aed" sub="Assigned to you" />
        }
      </div>

      {}
      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Incidents by Status</div>
              <div className="card-subtitle">Current distribution</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop:10 }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={barData} margin={{ top:4, right:10, left:-10, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'var(--text-m)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-m)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius:8, border:'1px solid var(--border)', fontSize:13 }} cursor={{ fill:'var(--gray-50)' }} />
                <Bar dataKey="value" name="Count" radius={[5,5,0,0]} maxBarSize={42}>
                  {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Status Breakdown</div>
              <div className="card-subtitle">Proportional view</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop:10 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                    cx="50%" cy="45%" outerRadius={78} innerRadius={38} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:8, fontSize:13 }} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:210, color:'var(--text-m)' }}>
                No data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">{isReporter ? 'My Recent Incidents' : 'Recent Incidents'}</div>
            <div className="card-subtitle">Last {recent.length} incidents</div>
          </div>
          <button className="btn btn-secondary btn-sm"
            onClick={() => navigate(isReporter ? '/app/incidents/my' : '/app/incidents')}>
            View All →
          </button>
        </div>
        <div className="table-wrap">
          {recent.length === 0 ? (
            <EmptyState icon="📭" title="No incidents yet"
              action={isReporter && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/app/incidents/new')}>
                  Raise First Incident
                </button>
              )} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Priority</th><th>Status</th>
                  <th>Category</th><th>Owner</th><th>SLA</th><th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(i => (
                  <tr key={i.incidentId} style={{ cursor:'pointer' }}
                    onClick={() => navigate(`/app/incidents/${i.incidentId}`)}>
                    <td><span className="td-link">#{i.incidentId}</span></td>
                    <td style={{ maxWidth:240 }}>
                      <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13 }}>
                        {i.title}
                      </div>
                      {i.slaBreach && <span className="badge sla-breach" style={{ marginTop:2, display:'inline-block' }}>SLA ⚠️</span>}
                    </td>
                    <td><PriorityBadge priority={i.priority} /></td>
                    <td><StatusBadge   status={i.status} /></td>
                    <td style={{ fontSize:12, color:'var(--text-m)' }}>{i.categoryName || '—'}</td>
                    <td style={{ fontSize:12, color:'var(--text-m)' }}>
                      {i.ownerName || <span style={{ color:'var(--red-600)', fontWeight:500 }}>Unassigned</span>}
                    </td>
                    <td>{i.slaBreach ? <span className="badge sla-breach">⚠️ Breach</span> : <span className="badge sla-ok">✓ OK</span>}</td>
                    <td style={{ fontSize:11, color:'var(--text-m)', whiteSpace:'nowrap' }}>{fmtAgo(i.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
