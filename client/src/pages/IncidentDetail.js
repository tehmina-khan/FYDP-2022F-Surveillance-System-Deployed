import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api';

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading]   = useState(true);

  const [status,         setStatus]         = useState(incident?.status || 'unreviewed');
  const [statusLoading,  setStatusLoading]  = useState(false);
  const [statusMsg,      setStatusMsg]      = useState('');
  const [reviewedByName, setReviewedByName] = useState(null);
  const [reviewedAt,     setReviewedAt]     = useState(null);

const toggleStatus = async () => {
  const newStatus = status === 'unreviewed' ? 'reviewed' : 'unreviewed';
  setStatusLoading(true);
  setStatusMsg('');

  try {
    const data = await apiFetch(`/api/incidents/${id}/status`, {
      method: 'PUT',
      body:   JSON.stringify({ status: newStatus }),
    });

    if (!data.success) {
      // Show the exact error from backend (including auth error)
      setStatusMsg(data.error || 'Failed to update status');
      setStatusLoading(false);
      return;
    }

    // Update local state with full response
    setStatus(data.data.status);
    setReviewedByName(data.data.reviewedByName || null);
    setReviewedAt(data.data.reviewedAt     || null);

    setStatusMsg(
      newStatus === 'reviewed' ? 'Marked as reviewed' : 'Marked as unreviewed'
    );
    setTimeout(() => setStatusMsg(''), 3000);

  } catch (err) {
    setStatusMsg('Failed to update status');
  } finally {
    setStatusLoading(false);
  }
};

    // ── Add this here ──────────────────────────────────────────────────────
  const getStreamableUrl = (url) => {
    if (!url) return null;
    // Force Cloudinary to transcode and stream as mp4
    return url.replace("/upload/", "/upload/f_mp4,vc_auto/");
  };
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
  apiFetch(`/api/incidents/${id}`)
      .then(d => {
        setIncident(d.data);
        setStatus(d.data?.status           || 'unreviewed');
        setReviewedByName(d.data?.reviewedByName || null);   // ← add
        setReviewedAt(d.data?.reviewedAt         || null);   // ← add
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading pulse">Loading incident...</div>;
  if (!incident) return <div className="empty">Incident not found.</div>;

  const isViolent = incident.probability >= 0.6;
  const probPct   = (incident.probability * 100).toFixed(1);
  const probColor = isViolent ? 'var(--red)' : incident.probability >= 0.4 ? 'var(--amber)' : 'var(--green)';

  return (
    <>
      <Link to="/incidents" className="back-btn">← Back to incidents</Link>

      {isViolent && (
        <div className="alert-banner">
          <span className="alert-banner-icon">⚠</span>
          <div className="alert-banner-text">
            <strong>Violence Confirmed</strong>
            This incident was flagged with {probPct}% confidence by the detection model.
          </div>
        </div>
      )}

      <div className="page-header">
        <h1>Incident #{id.slice(-6).toUpperCase()}</h1>
        <p>Recorded on {new Date(incident.timestamp).toLocaleString()}</p>
      </div>

      {/* ── Status bar ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        background:     'var(--card)',
        border:         '1px solid var(--border)',
        borderRadius:   10,
        padding:        '1rem 1.5rem',
        marginBottom:   '1.5rem',
      }}>

        {/* Left — current status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            Review Status:
          </span>
          {status === 'reviewed' ? (
            <span className="badge badge-success">
              <span className="dot" /> Reviewed
            </span>
          ) : (
            <span className="badge badge-warning">
              <span className="dot" /> Unreviewed
            </span>
          )}
        </div>

        {/* Right — toggle button + feedback message */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {statusMsg && (
            <span style={{
              fontSize:   12,
              fontFamily: 'var(--mono)',
              color: statusMsg.includes('authorized') || statusMsg.includes('Failed')
                ? 'var(--red)' : 'var(--green)',
            }}>
              {statusMsg.includes('authorized') || statusMsg.includes('Failed')
                ? '✕' : '✓'} {statusMsg}
            </span>
          )}
          <button
            onClick={toggleStatus}
            disabled={statusLoading}
            style={{
              background:   status === 'reviewed'
                ? 'rgba(255,255,255,0.04)' : 'rgba(46,196,182,0.1)',
              border:       status === 'reviewed'
                ? '1px solid var(--border)'
                : '1px solid rgba(46,196,182,0.3)',
              color:        status === 'reviewed'
                ? 'var(--muted)' : 'var(--green)',
              borderRadius: 8,
              padding:      '8px 18px',
              fontSize:     13,
              fontFamily:   'var(--mono)',
              cursor:       statusLoading ? 'not-allowed' : 'pointer',
              opacity:      statusLoading ? 0.6 : 1,
              transition:   'all 0.15s',
              letterSpacing: 0.5,
            }}
          >
            {statusLoading
              ? 'Updating...'
              : status === 'reviewed'
                ? '↩ Mark as Unreviewed'
                : '✓ Mark as Reviewed'}
          </button>
        </div>

      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-card-header">▶ Video Clip</div>
          <div className="detail-card-body">
            {incident.video_url ? (
              <video
                controls
                width="100%"
                style={{ borderRadius: 6, background: '#000' }}
                src={getStreamableUrl(incident.video_url)}
                type="video/mp4"
                onError={(e) => console.error("Video load error:", e)}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center',
                color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                No video available
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-card-header">◉ Snapshot</div>
          <div className="detail-card-body">
            {incident.image_url ? (
              <img src={incident.image_url} alt="Incident snapshot" />
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                No snapshot available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="detail-card">
        <div className="detail-card-header">■ Incident Metadata</div>
        <div className="detail-card-body">
          <table className="meta-table">
            <tbody>
              <tr>
                <td className="meta-key">Camera ID</td>
                <td className="meta-val" style={{ fontFamily: 'var(--mono)' }}>{incident.camera_id}</td>
              </tr>
              <tr>
                <td className="meta-key">Timestamp</td>
                <td className="meta-val">{new Date(incident.timestamp).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="meta-key">Confidence</td>
                <td className="meta-val">
                  <div className="prob-bar-wrap">
                    <div className="prob-bar" style={{ maxWidth: 140 }}>
                      <div className="prob-fill" style={{ width: `${incident.probability * 100}%`, background: probColor }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', color: probColor, fontSize: 15, fontWeight: 600 }}>
                      {probPct}%
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="meta-key">Classification</td>
                <td className="meta-val">
                  {isViolent
                    ? <span className="badge badge-danger"><span className="dot" /> Violence Detected</span>
                    : <span className="badge badge-success"><span className="dot" /> Non-Violence</span>}
                </td>
              </tr>
              {/* Reviewed By */}
              <tr>
                <td className="meta-key">Reviewed By</td>
                <td className="meta-val">
                  {reviewedByName ? (
                    <span style={{ color: 'var(--green)', fontWeight: 500 }}>
                      {reviewedByName}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)',
                      fontStyle: 'italic', fontSize: 13 }}>
                      Not reviewed yet
                    </span>
                  )}
                </td>
              </tr>

              {/* Reviewed At */}
              <tr>
                <td className="meta-key">Reviewed At</td>
                <td className="meta-val">
                  {reviewedAt ? (
                    <span style={{ fontSize: 13 }}>
                      {new Date(reviewedAt).toLocaleString()}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)',
                      fontStyle: 'italic', fontSize: 13 }}>
                      Not reviewed yet
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="meta-key">Video Path</td>
                <td className="meta-val" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                  {incident.video_url || '—'}
                </td>
              </tr>
              <tr>
                <td className="meta-key">Image Path</td>
                <td className="meta-val" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                  {incident.image_url || '—'}
                </td>
              </tr>
              <tr>
                <td className="meta-key">Record ID</td>
                <td className="meta-val" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                  {incident._id}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}