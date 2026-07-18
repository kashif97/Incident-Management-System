import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import { PageLoader, EmptyState, Pagination, useToast, ToastStack, PageHeader } from '../../components/common';
import { fmtDt } from '../../utils/helpers';

export default function AuditLogsPage() {
  const toast = useToast();
  const [logs,  setLogs]  = useState([]);
  const [loading,setLoad] = useState(true);
  const [page,  setPage]  = useState(0);
  const [tp,    setTp]    = useState(0);
  const [total, setTotal] = useState(0);
  const [search,setSearch]= useState('');

  const fetchLogs = useCallback(async (p = 0) => {
    setLoad(true);
    try {
      const res = await adminAPI.auditLogs({ page: p, size: 20 });
      const d   = res.data.data;
      setLogs(d.content || []);
      setTp(d.totalPages || 0);
      setTotal(d.totalElements || 0);
      setPage(p);
    } catch { toast.error('Failed to load audit logs'); }
    finally   { setLoad(false); }
  }, []);

  useEffect(() => { fetchLogs(0); }, [fetchLogs]);

  const ACTION_COLOR = {
    USER_CREATED:'var(--green-600)',USER_UPDATED:'var(--blue-600)',
    USER_DEACTIVATED:'var(--red-600)',
  };

  const filtered = search
    ? logs.filter(l =>
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.entityName?.toLowerCase().includes(search.toLowerCase()) ||
        l.performedBy?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="anim-in">
      <ToastStack toasts={toast.toasts} />

      <PageHeader
        title="📋 Audit Logs"
        sub={`${total} audit records — ITIL-compliant, read-only`}
        actions={<button className="btn btn-secondary btn-sm" onClick={() => fetchLogs(page)}>↻ Refresh</button>}
      />

      <div className="info-banner">
        <div className="info-banner-icon">🔒</div>
        <div>
          <div className="info-banner-title">Read-Only — No Edit or Delete</div>
          <div className="info-banner-text">
            All system actions are permanently recorded here for ITIL compliance and security traceability.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-wrap" style={{ flex:1, maxWidth:360 }}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by action, entity, or user…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {search && <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>✕</button>}
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-m)' }}>{total} records</span>
        </div>

        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <EmptyState icon="📋" title="No audit records found" sub="Actions will appear here as they are performed." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Performed By</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>Change Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.logId}>
                      <td style={{ fontSize:12, whiteSpace:'nowrap', color:'var(--text-m)' }}>
                        {fmtDt(l.performedAt)}
                      </td>
                      <td style={{ fontSize:13, fontWeight:500 }}>{l.performedBy || '—'}</td>
                      <td>
                        <span style={{
                          fontFamily:'var(--mono)', fontSize:11, fontWeight:600,
                          color: ACTION_COLOR[l.action] || 'var(--text-s)',
                          background: 'var(--gray-100)', padding:'2px 8px', borderRadius:'var(--r-full)',
                        }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={{ fontSize:12, fontWeight:600, color:'var(--text-m)' }}>{l.entityName}</td>
                      <td className="td-link" style={{ cursor:'default', color:'var(--text-m)' }}>{l.entityId || '—'}</td>
                      <td style={{ maxWidth:280 }}>
                        {l.newValue && (
                          <div style={{ fontSize:12, color:'var(--green-700)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            → {l.newValue}
                          </div>
                        )}
                        {l.oldValue && (
                          <div style={{ fontSize:11, color:'var(--text-m)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            was: {l.oldValue}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={total} totalPages={tp} onPage={fetchLogs} />
          </>
        )}
      </div>
    </div>
  );
}
