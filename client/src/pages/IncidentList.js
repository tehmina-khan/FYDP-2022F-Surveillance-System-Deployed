import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import ReportDownloader from '../components/ReportDownloader';

export default function IncidentList() {
  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/incidents', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('cctv_token')}`,
      },
    })
      .then(r => r.json())
      .then(d => { setIncidents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = incidents.filter(i => {
    if (filter === 'violence')    return i.probability >= 0.6;
    if (filter === 'nonviolence') return i.probability < 0.6;
    return true;
  });

  const probColor = (p) =>
    p >= 0.6 ? 'var(--red)' : p >= 0.4 ? 'var(--amber)' : 'var(--green)';

  return (
    <>
      <div className="page-header">
        <h1>All Incidents</h1>
        <p>{incidents.length} total records in database</p>
      </div>

      {/* ── Report downloader ── */}
      <ReportDownloader />

      {/* ── Incident table ── */}
      <div className="table-wrap">
        <div className="table-header">
          <h2>Incident Log</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'violence', 'nonviolence'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding:     '4px 12px',
                  borderRadius: 20,
                  border:      '1px solid',
                  fontSize:    12,
                  cursor:      'pointer',
                  fontFamily:  'var(--mono)',
                  background:  filter === f ? 'var(--red)' : 'transparent',
                  color:       filter === f ? '#fff' : 'var(--muted)',
                  borderColor: filter === f ? 'var(--red)' : 'var(--border)',
                  transition:  'all 0.15s',
                }}
              >
                {f === 'all' ? 'All'
                  : f === 'violence' ? 'Violence' : 'Non-Violence'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading pulse">Fetching records...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No incidents match this filter.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Camera</th>
                <th>Timestamp</th>
                <th>Confidence</th>
                <th>Video</th>
                <th>Review Status</th>
                <th>Violence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc => (
                <tr key={inc._id}
                  onClick={() => navigate(`/incident/${inc._id}`)}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 11,
                    color: 'var(--muted)' }}>
                    {inc._id.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>
                    {inc.camera_id}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {new Date(inc.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div className="prob-bar-wrap">
                      <div className="prob-bar">
                        <div className="prob-fill" style={{
                          width:      `${inc.probability * 100}%`,
                          background: probColor(inc.probability),
                        }} />
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12,
                        color: probColor(inc.probability) }}>
                        {(inc.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)',
                    fontFamily: 'var(--mono)' }}>
                    {inc.video_url ? '▶ Available' : '— None'}
                  </td>
                  <td>
                    {inc.status === 'reviewed' ? (
                      <span className="badge badge-success">
                        <span className="dot" /> Reviewed
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <span className="dot" /> Unreviewed
                      </span>
                    )}
                  </td>
                  <td>
                    {inc.probability >= 0.6
                      ? <span className="badge badge-danger">
                          <span className="dot" /> Violence
                        </span>
                      : <span className="badge badge-success">
                          <span className="dot" /> Non-Violence
                        </span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}