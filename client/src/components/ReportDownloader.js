import React, { useState } from 'react';

const BASE = "https://fydp-2022f-surveillance-system-deployed-production.up.railway.app";    // ← full URL, no proxy needed

export default function ReportDownloader() {
  const today     = new Date().toISOString().split('T')[0];
  const [from,    setFrom]    = useState(today);
  const [to,      setTo]      = useState(today);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleDownload = async () => {
    setError('');

    if (!from || !to) {
      setError('Please select both dates'); return;
    }
    if (new Date(from) > new Date(to)) {
      setError('"From" date cannot be after "To" date'); return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('cctv_token');
      const res   = await fetch(
        `${BASE}/api/incidents/report?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate report');
        setLoading(false);
        return;
      }

      // Trigger browser download
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `incident_report_${from}_to_${to}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background:   'var(--card)',
    border:       '1px solid var(--border)',
    borderRadius: 8,
    padding:      '9px 12px',
    color:        'var(--text)',
    fontSize:     13,
    fontFamily:   'var(--mono)',
    outline:      'none',
    cursor:       'pointer',
  };

  return (
    <div style={{
      background:   'var(--card)',
      border:       '1px solid var(--border)',
      borderRadius: 10,
      padding:      '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      display:      'flex',
      alignItems:   'center',
      gap:          '1rem',
      flexWrap:     'wrap',
    }}>

      {/* Label */}
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11,
        color: 'var(--muted)', letterSpacing: 1,
        textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        Download Report
      </div>

      {/* From date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)',
          fontFamily: 'var(--mono)' }}>
          From
        </span>
        <input
          type="date"
          value={from}
          max={today}
          onChange={e => setFrom(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* To date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)',
          fontFamily: 'var(--mono)' }}>
          To
        </span>
        <input
          type="date"
          value={to}
          max={today}
          onChange={e => setTo(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          background:   loading ? 'var(--red-dim)' : 'var(--red)',
          color:        '#fff',
          border:       'none',
          borderRadius: 8,
          padding:      '9px 20px',
          fontSize:     13,
          fontFamily:   'var(--mono)',
          cursor:       loading ? 'not-allowed' : 'pointer',
          display:      'flex',
          alignItems:   'center',
          gap:          7,
          transition:   'opacity 0.2s',
          whiteSpace:   'nowrap',
        }}
      >
        {loading ? (
          <>⏳ Generating...</>
        ) : (
          <>↓ Download PDF</>
        )}
      </button>

      {/* Error */}
      {error && (
        <span style={{ fontSize: 12, color: 'var(--red)',
          fontFamily: 'var(--mono)' }}>
          ✕ {error}
        </span>
      )}

    </div>
  );
}