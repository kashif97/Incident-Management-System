import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentAPI } from '../../api';
import { PageLoader, StatusBadge, PriorityBadge, useToast, ToastStack, PageHeader, KpiCard } from '../../components/common';
import { fmtDt, fmtAgo } from '../../utils/helpers';

export default function SlaMonitorPage() {
  const navigate = useNavigate();
  const toast    = useToast();
  const [incidents, setIncidents] = useState([]);
  const [kpi,  setKpi]    = useState(null);
  const [loading, setLoad]= useState(true);
  const [filter, setFilter]= useState('all'); // all | breach | at-risk | ok

  useEffect(() => {
    (async () => {
      try {
        const [ir, kr] = await Promise.all([
          incidentAPI.list({ page:0, size:100 }),
          incidentAPI.kpi(),
        ]);
        setIncidents(ir.data.data?.content || []);
        setKpi(kr.data.data);
      } catch { toast.error('Failed to load SLA data'); }
      finally { setLoad(false); }
    })();
  }, []);

  const now = Date.now();

  const enriched = incidents
    .filter(i => !['CLOSED','RESOLVED'].includes(i.status))
    .map(i => {
      const breached = i.slaBreach;
      return { ...i, breached };
    });

  const filtered = enriched.filter(i => {
    if (filter === 'breach')  return i.breached;
    if (filter === 'ok')      return !i.breached;
    return true;
  });

  const breachCount   = enriched.filter(i => i.breached).length;
  const activeCount   = enriched.length;
  const okCount       = enriched.filter(i => !i.breached).length;

  const priorityBreaches = ['CRITICAL','HIGH','MEDIUM','LOW'].map(p => ({
    priority: p,
    total:    enriched.filter(i => i.priority === p).length,
    breached: enriched.filter(i => i.priority === p && i.breached).length,
  }));

  if (loading) return <PageLoader text="Loading SLA monitor…" />;

  return (
    <div className="anim-in">
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title="⏱️ SLA Monitor"
        sub="Real-time SLA compliance across all active incidents"
        actions={<button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>↻ Refresh</button>}
      />

      {}
      <div className="kpi-grid">
        <KpiCard label="Active Incidents"   value={activeCount}          icon="📋" color="var(--primary)" />
        <KpiCard label="SLA Breaches"        value={breachCount}          icon="🚨" color="#dc2626" sub="Requires immediate action" />
        <KpiCard label="Within SLA"          value={okCount}              icon="✅" color="#16a34a" />
        <KpiCard label="Global Breaches"     value={kpi?.slaBreaches}     icon="⚠️" color="#d97706" sub="All-time" />
      </div>

      {}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">🌡️ SLA Heatmap by Priority</div>
          <div className="card-subtitle">Breaches per priority level</div>
        </div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {priorityBreaches.map(({ priority, total, breached }) => {
              const pct = total > 0 ? Math.round((breached/total)*100) : 0;
              const colors = { CRITICAL:'#dc2626', HIGH:'#ea580c', MEDIUM:'#d97706', LOW:'#16a34a' };
              const color  = colors[priority];
              return (
                <div key={priority} style={{
                  padding:'16px', borderRadius:'var(--r)',
                  background: `${color}10`, border:`1px solid ${color}30`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span className={`badge p-${priority}`}>{priority}</span>
                    <span style={{ fontSize:11, color:'var(--text-m)' }}>{total} active</span>
                  </div>
                  <div style={{ fontSize:24, fontWeight:800, color, letterSpacing:'-1px', marginBottom:4 }}>
                    {breached}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-m)', marginBottom:8 }}>
                    breaches ({pct}%)
                  </div>
                  {total > 0 && (
                    <div className="sla-bar">
                      <div className="sla-fill" style={{
                        width:`${pct}%`,
                        background: pct > 50 ? '#dc2626' : pct > 20 ? '#d97706' : '#16a34a',
                      }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Active Incidents — SLA Status</div>
            <div className="card-subtitle">{filtered.length} shown</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[['all','All'],['breach','Breached 🚨'],['ok','Within SLA ✓']].map(([v,l]) => (
              <button key={v} className={`btn btn-sm ${filter===v?'btn-primary':'btn-secondary'}`}
                onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text-m)' }}>
              {filter === 'breach' ? '🎉 No SLA breaches! Great work.' : 'No incidents match this filter.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Priority</th><th>Status</th>
                  <th>Owner</th><th>SLA Status</th><th>Updated</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.incidentId} style={{ background: i.breached ? '#fef2f240' : undefined }}>
                    <td><span className="td-link" onClick={() => navigate(`/app/incidents/${i.incidentId}`)}>#{i.incidentId}</span></td>
                    <td style={{ maxWidth:220, fontWeight:600, fontSize:13 }}>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.title}</div>
                    </td>
                    <td><PriorityBadge priority={i.priority} /></td>
                    <td><StatusBadge   status={i.status} /></td>
                    <td style={{ fontSize:12 }}>{i.ownerName || <span style={{ color:'var(--red-600)', fontWeight:500 }}>Unassigned</span>}</td>
                    <td>
                      {i.breached
                        ? <span className="badge sla-breach">⚠️ Breached</span>
                        : <span className="badge sla-ok">✓ Within SLA</span>
                      }
                    </td>
                    <td style={{ fontSize:11, color:'var(--text-m)' }}>{fmtAgo(i.updatedAt)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/app/incidents/${i.incidentId}`)}>
                        View
                      </button>
                    </td>
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
