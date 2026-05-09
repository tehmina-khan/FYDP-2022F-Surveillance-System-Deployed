import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function PendingApprovals() {
  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [toast,    setToast]   = useState(null);

  const fetchPending = async () => {
    try {
      const data = await apiFetch('/api/users/pending');
      setUsers(data.users || []);
    } catch (err) {
      showToast('Failed to load pending users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (userId, userName) => {
    setActionId(userId);
    try {
      const data = await apiFetch(`/api/users/${userId}/approve`, {
        method: 'PUT',
      });
      if (data.success) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        showToast(`${userName} approved successfully`);
      } else {
        showToast(data.error || 'Approval failed', 'error');
      }
    } catch (err) {
      showToast('Approval failed', 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Reject "${userName}"? They will not be able to log in.`)) return;
    setActionId(userId);
    try {
      const data = await apiFetch(`/api/users/${userId}/reject`, {
        method: 'PUT',
      });
      if (data.success) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        showToast(`${userName} rejected`);
      } else {
        showToast(data.error || 'Rejection failed', 'error');
      }
    } catch (err) {
      showToast('Rejection failed', 'error');
    } finally {
      setActionId(null);
    }
  };

  const td = { padding: '1rem 1.5rem', fontSize: 14 };
  const th = {
    textAlign: 'left', fontSize: 11, color: 'var(--muted)',
    fontFamily: 'var(--mono)', textTransform: 'uppercase',
    letterSpacing: 1, padding: '0.75rem 1.5rem',
    borderBottom: '1px solid var(--border)', fontWeight: 400,
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          padding: '12px 20px', borderRadius: 8,
          fontSize: 13, fontFamily: 'monospace', zIndex: 999,
          background: toast.type === 'error'
            ? 'rgba(230,57,70,0.15)' : 'rgba(46,196,182,0.15)',
          border: `1px solid ${toast.type === 'error'
            ? '#7a1a20' : 'rgba(46,196,182,0.3)'}`,
          color: toast.type === 'error' ? '#e63946' : '#2ec4b6',
        }}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.message}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between' }}>
            <div>
              <h1>Pending Approvals</h1>
              <p>Review and approve new user registrations</p>
            </div>
            <div style={{
              background: 'rgba(244,162,97,0.1)',
              border: '1px solid rgba(244,162,97,0.3)',
              borderRadius: 20, padding: '4px 14px',
              fontFamily: 'var(--mono)', fontSize: 12,
              color: 'var(--amber)',
            }}>
              {users.length} pending
            </div>
          </div>
        </div>

        {/* Empty state */}
        {!loading && users.length === 0 && (
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '4rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✓</div>
            <div style={{ color: 'var(--muted)', fontFamily: 'var(--mono)',
              fontSize: 13 }}>
              No pending approvals
            </div>
          </div>
        )}

        {/* Table */}
        {(loading || users.length > 0) && (
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: 14, fontWeight: 600 }}>
                Awaiting Review
              </h2>
            </div>

            {loading ? (
              <div className="loading pulse">Loading...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>Requested</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const isBusy = actionId === u._id;
                    return (
                      <tr key={u._id} style={{
                        borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                        opacity:   isBusy ? 0.5 : 1,
                        transition: 'opacity 0.2s',
                      }}>

                        {/* Name */}
                        <td style={td}>
                          <div style={{ display: 'flex',
                            alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32,
                              borderRadius: '50%',
                              background: 'rgba(244,162,97,0.1)',
                              border: '1px solid rgba(244,162,97,0.3)',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13, color: 'var(--amber)',
                              fontFamily: 'var(--mono)',
                            }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ ...td, color: 'var(--muted)',
                          fontFamily: 'var(--mono)', fontSize: 12 }}>
                          {u.email}
                        </td>

                        {/* Date */}
                        <td style={{ ...td, color: 'var(--muted)', fontSize: 12 }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              disabled={isBusy}
                              onClick={() => handleApprove(u._id, u.name)}
                              style={{
                                background:   'rgba(46,196,182,0.1)',
                                border:       '1px solid rgba(46,196,182,0.3)',
                                color:        'var(--green)',
                                borderRadius: 6,
                                padding:      '6px 16px',
                                fontSize:     12,
                                fontFamily:   'var(--mono)',
                                cursor:       isBusy ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {isBusy ? '...' : '✓ Approve'}
                            </button>
                            <button
                              disabled={isBusy}
                              onClick={() => handleReject(u._id, u.name)}
                              style={{
                                background:   'rgba(230,57,70,0.1)',
                                border:       '1px solid rgba(230,57,70,0.3)',
                                color:        'var(--red)',
                                borderRadius: 6,
                                padding:      '6px 16px',
                                fontSize:     12,
                                fontFamily:   'var(--mono)',
                                cursor:       isBusy ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {isBusy ? '...' : '✕ Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}