import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { reportAPI } from '../../api';
import { KpiCard, PageLoader, useToast, ToastStack, PageHeader, EmptyState } from '../../components/common';
import { fmtMins } from '../../utils/helpers';

const COLORS = ['#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#9d174d','#475569','#db2777'];
const PRIORITY_COLORS = { CRITICAL:'#dc2626', HIGH:'#ea580c', MEDIUM:'#d97706', LOW:'#16a34a' };

export default function ReportsPage() {
  const toast = useToast();
  const [report,  setReport]  = useState(null);
  const [loading, setLoad]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await reportAPI.summary();
        setReport(r.data.data);
      } catch { toast.error('Failed to load report data'); }
      finally { setLoad(false); }
    })();
  }, []);

  if (loading) return <PageLoader text="Building reports…" />;
  if (!report) return <EmptyState icon="📊" title="No report data available" />;

  const statusData = Object.entries(report.byStatus || {}).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }));
  const priorityData = Object.entries(report.byPriority || {}).map(([k, v]) => ({ name: k, value: v }));
  const categoryData = Object.entries(report.byCategory || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => ({ name: k, value: v }));

  const slaColor = report.slaCompliancePercent >= 90 ? '#16a34a'
    : report.slaCompliancePercent >= 70 ? '#d97706' : '#dc2626';

  return (
    <div className="anim-in">
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title="📊 Incident Reports"
        sub="MTTR, SLA compliance, volume analysis and team performance"
        actions={<button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>↻ Refresh</button>}
      />

      {/* KPI Row */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard label="Total Incidents"   value={report.totalIncidents}   icon="📋" color="#2563eb" />
        <KpiCard label="Closed"            value={report.closedIncidents}   icon="🔒" color="#475569" />
        <KpiCard label="Open"              value={report.openIncidents}     icon="🔓" color="#d97706" />
        <KpiCard label="SLA Breaches"      value={report.slaBreaches}       icon="🚨" color="#dc2626" />
        <KpiCard label="Escalated"         value={report.escalatedIncidents} icon="🔺" color="#9d174d" />
        <KpiCard
          label="Avg MTTR"
          value={report.avgMttrMinutes ? fmtMins(Math.round(report.avgMttrMinutes)) : '—'}
          icon="⏱️" color="#0891b2"
          sub="Mean Time To Resolve"
        />
        <KpiCard
          label="Avg Response Time"
          value={report.avgResponseTimeMinutes ? fmtMins(Math.round(report.avgResponseTimeMinutes)) : '—'}
          icon="⚡" color="#7c3aed"
          sub="Create → Resolve"
        />
        <KpiCard
          label="SLA Compliance"
          value={`${report.slaCompliancePercent ?? 100}%`}
          icon="✅" color={slaColor}
          sub="Non-breached incidents"
        />
      </div>

      {/* SLA Compliance Gauge + Priority Breakdown */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* SLA Compliance Visual */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🎯 SLA Compliance Rate</div>
            <div className="card-subtitle">% of incidents resolved within SLA</div></div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 160, height: 160, borderRadius: '50%', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: `conic-gradient(${slaColor} ${report.slaCompliancePercent ?? 100}%, #e2e8f0 0)`,
              position: 'relative',
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', background: 'var(--surface)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'absolute',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: slaColor }}>
                  {report.slaCompliancePercent ?? 100}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-m)' }}>Compliant</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ {report.totalIncidents - report.slaBreaches} within SLA</span>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {report.slaBreaches} breached</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🎨 Incidents by Priority</div>
            <div className="card-subtitle">Volume per priority level</div></div>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-m)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-m)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }} />
                <Bar dataKey="value" name="Count" radius={[5, 5, 0, 0]} maxBarSize={50}>
                  {priorityData.map((e, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[e.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status Distribution + Category Breakdown */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">📊 Status Distribution</div>
            <div className="card-subtitle">Current lifecycle spread</div></div>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name"
                    cx="50%" cy="45%" outerRadius={75} innerRadius={35} paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-m)' }}>
                No data yet
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🗂️ Incidents by Category</div>
            <div className="card-subtitle">Top 8 categories</div></div>
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 20, left: 10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-m)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-m)' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" name="Incidents" radius={[0, 5, 5, 0]} maxBarSize={18}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Resolvers Table */}
      {report.topResolvers && report.topResolvers.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🏆 Top Resolvers</div>
            <div className="card-subtitle">By number of resolved incidents</div></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Rank</th><th>Resolver</th><th>Resolved Count</th><th>Avg MTTR</th><th>Performance</th></tr>
              </thead>
              <tbody>
                {report.topResolvers.map((r, i) => (
                  <tr key={r.resolverName}>
                    <td>
                      <span style={{
                        fontSize: 16,
                        display: 'inline-block', width: 28, textAlign: 'center',
                      }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.resolverName}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: 16, color: '#2563eb',
                      }}>{r.resolved}</span>
                    </td>
                    <td style={{ color: 'var(--text-s)' }}>
                      {r.avgMttrMinutes ? fmtMins(Math.round(r.avgMttrMinutes)) : '—'}
                    </td>
                    <td>
                      <div style={{
                        height: 8, width: 120, background: 'var(--border)',
                        borderRadius: 4, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (r.resolved / report.topResolvers[0].resolved) * 100)}%`,
                          background: i === 0 ? '#f59e0b' : '#2563eb',
                          borderRadius: 4,
                        }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
