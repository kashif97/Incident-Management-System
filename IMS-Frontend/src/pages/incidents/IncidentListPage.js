import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentAPI } from '../../api';
import {
  StatusBadge, PriorityBadge, PageLoader, EmptyState,
  Pagination, useToast, ToastStack, PageHeader,
} from '../../components/common';
import { fmtAgo, PRIORITIES, ALL_STATUSES } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function IncidentListPage({ myOnly = false }) {
  const navigate  = useNavigate();
  const { isReporter, isResolver, isManager, isAdmin } = useAuth();
  const toast = useToast();

  const [rows,       setRows]    = useState([]);
  const [loading,    setLoad]    = useState(true);
  const [page,       setPage]    = useState(0);
  const [totalPages, setTP]      = useState(0);
  const [total,      setTotal]   = useState(0);
  const [filters,    setFilters] = useState({ status:'', priority:'', search:'' });

  const fetchData = useCallback(async (p = 0) => {
    setLoad(true);
    try {
      const params = { page: p, size: 20 };
      if (filters.status)   params.status   = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search)   params.search   = filters.search;

      let res;
      if (myOnly && isResolver) {
        // RESOLVER "Assigned to Me" → /api/incidents/assigned-to-me
        res = await incidentAPI.assignedToMe(params);
      } else if (myOnly || isReporter) {
        // REPORTER "My Incidents" → /api/incidents/my (created by them)
        res = await incidentAPI.myList(params);
      } else {
        // All other roles → /api/incidents (full queue)
        res = await incidentAPI.list(params);
      }

      const d = res.data.data;
      setRows(d.content || []);
      setTP(d.totalPages  || 0);
      setTotal(d.totalElements || 0);
      setPage(p);
    } catch { toast.error('Failed to load incidents'); }
    finally   { setLoad(false); }
  }, [filters, myOnly, isReporter, isResolver]);

  useEffect(() => { fetchData(0); }, [fetchData]);

  const sf = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const hasFilters = filters.status || filters.priority || filters.search;

  const getTitle = () => {
    if (myOnly && isResolver) return '🔧 Assigned to Me';
    if (myOnly || isReporter) return '📋 My Incidents';
    return '📋 Incident Queue';
  };

  const getEmptyTitle = () => {
    if (myOnly && isResolver) return 'No incidents assigned to you yet';
    if (isReporter) return 'No incidents raised yet';
    return 'No incidents found';
  };

  const getEmptySub = () => {
    if (myOnly && isResolver) return 'Incidents assigned to you by the Incident Manager will appear here.';
    if (isReporter) return 'Raise your first incident to get started.';
    if (hasFilters) return 'Try clearing the filters to see more results.';
    return 'No incidents in the system yet.';
  };

  return (
    <div className="anim-in">
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title={getTitle()}
        sub={`${total} incident${total !== 1 ? 's' : ''}`}
        actions={<>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchData(page)}>↻ Refresh</button>
          {isReporter && (
            <button className="btn btn-primary" onClick={() => navigate('/app/incidents/new')}>
              ➕ Raise Incident
            </button>
          )}
        </>}
      />

      {/* Info banner for resolver assigned-to-me view */}
      {myOnly && isResolver && (
        <div className="info-banner" style={{ marginBottom: 20 }}>
          <div className="info-banner-icon">🔧</div>
          <div>
            <div className="info-banner-title">Your Assigned Incidents</div>
            <div className="info-banner-text">
              These are incidents assigned to you by the Incident Manager. Update the status
              as you work through each one.
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-wrap" style={{ flex:1, minWidth:180 }}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by title…"
              value={filters.search}
              onChange={e => sf('search', e.target.value)} />
          </div>

          <select className="filter-select" value={filters.status} onChange={e => sf('status', e.target.value)}>
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>

          <select className="filter-select" value={filters.priority} onChange={e => sf('priority', e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {hasFilters && (
            <button className="btn btn-ghost btn-sm"
              onClick={() => setFilters({ status:'', priority:'', search:'' })}>
              ✕ Clear
            </button>
          )}

          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-m)' }}>
            {total} result{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        {loading ? <PageLoader /> : rows.length === 0 ? (
          <EmptyState
            icon={myOnly && isResolver ? '🎯' : '📭'}
            title={getEmptyTitle()}
            sub={getEmptySub()}
            action={isReporter ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/app/incidents/new')}>
                Raise First Incident
              </button>
            ) : undefined}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Reporter</th>
                    <th>Assigned To</th>
                    <th>SLA</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(i => (
                    <tr key={i.incidentId} style={{ cursor:'pointer' }}
                      onClick={() => navigate(`/app/incidents/${i.incidentId}`)}>
                      <td><span className="td-link">#{i.incidentId}</span></td>
                      <td style={{ maxWidth:280 }}>
                        <div style={{
                          fontWeight:600, overflow:'hidden', textOverflow:'ellipsis',
                          whiteSpace:'nowrap', fontSize:13,
                        }}>
                          {i.title}
                        </div>
                      </td>
                      <td><PriorityBadge priority={i.priority} /></td>
                      <td><StatusBadge   status={i.status} /></td>
                      <td style={{ fontSize:12, color:'var(--text-m)' }}>{i.categoryName || '—'}</td>
                      <td style={{ fontSize:12 }}>{i.createdByName || '—'}</td>
                      <td style={{ fontSize:12 }}>
                        {i.ownerName
                          ? <span style={{ fontWeight:600, color:'var(--green-700)' }}>{i.ownerName}</span>
                          : <span style={{ color:'var(--red-600)', fontWeight:500 }}>Unassigned</span>
                        }
                      </td>
                      <td>
                        {i.slaBreach
                          ? <span className="badge sla-breach">⚠️ Breached</span>
                          : <span className="badge sla-ok">✓ OK</span>
                        }
                      </td>
                      <td style={{ fontSize:11, color:'var(--text-m)', whiteSpace:'nowrap' }}>
                        {fmtAgo(i.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} totalPages={totalPages} onPage={fetchData} />
          </>
        )}
      </div>
    </div>
  );
}
