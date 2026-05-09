import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/api/incidents')
      .then(d => { setIncidents(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const total     = incidents.length;
  const violent   = incidents.filter(i => i.probability >= 0.6).length;
  const avgProb   = total ? (incidents.reduce((s, i) => s + i.probability, 0) / total * 100).toFixed(1) : '0.0';
  const recent5   = incidents.slice(0, 5);

  const probColor = (p) => p >= 0.6 ? 'var(--red)' : p >= 0.4 ? 'var(--amber)' : 'var(--green)';

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>System Dashboard</h1>
            <p>Real-time violence detection overview</p>
          </div>
          <div className="live-indicator">
            <span className="live-dot" />
            SYSTEM ACTIVE
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Incidents</div>
          <div className="stat-value">{loading ? '—' : total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Violence Alerts</div>
          <div className="stat-value red">{loading ? '—' : violent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Confidence</div>
          <div className="stat-value amber">{loading ? '—' : `${avgProb}%`}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Non-Violence</div>
          <div className="stat-value green">{loading ? '—' : total - violent}</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <h2>Recent Incidents</h2>
          <span
            style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--mono)' }}
            onClick={() => navigate('/incidents')}
          >
            View all →
          </span>
        </div>

        {loading ? (
          <div className="loading pulse">Loading incidents...</div>
        ) : recent5.length === 0 ? (
          <div className="empty">No incidents recorded yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Camera</th>
                <th>Timestamp</th>
                <th>Confidence</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent5.map(inc => (
                <tr key={inc._id} onClick={() => navigate(`/incident/${inc._id}`)}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{inc.camera_id}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {new Date(inc.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div className="prob-bar-wrap">
                      <div className="prob-bar">
                        <div className="prob-fill" style={{ width: `${inc.probability * 100}%`, background: probColor(inc.probability) }} />
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: probColor(inc.probability) }}>
                        {(inc.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    {inc.probability >= 0.6
                      ? <span className="badge badge-danger"><span className="dot" /> Violence</span>
                      : <span className="badge badge-success"><span className="dot" /> Non-Violence</span>}
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}