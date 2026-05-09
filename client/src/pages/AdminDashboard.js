import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function AdminDashboard() {
  const { user }                    = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState(null);  // tracks which user is busy
  const [toast, setToast]           = useState(null);  // success/error message

  // ── Block non-admins ───────────────────────────────────────────────────────
  // ✅ Show access denied inside the layout, sidebar stays visible
    if (user?.role !== 'admin') {
    return (
        <div style={{
        maxWidth:   1100,
        margin:     '0 auto',
        width:      '100%',
        paddingTop: '4rem',
        textAlign:  'center',
        }}>
        <div style={{
            background:   'rgba(230,57,70,0.08)',
            border:       '1px solid rgba(230,57,70,0.2)',
            borderRadius: 10,
            padding:      '3rem',
            display:      'inline-block',
        }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⛔</div>
            <div style={{ fontFamily: 'monospace', color: '#e63946',
            fontSize: 14, letterSpacing: 1 }}>
            ACCESS DENIED
            </div>
            <div style={{ color: '#5a6478', fontSize: 13,
            marginTop: 8 }}>
            This page is restricted to administrators only.
            </div>
        </div>
        </div>
    );
    }

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/api/users');
      setUsers(data.users || []);
    } catch (err) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Delete user ────────────────────────────────────────────────────────────
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;

    setActionId(userId);
    try {
      const data = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (data.success) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        showToast(`${userName} deleted successfully`);
      } else {
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    } finally {
      setActionId(null);
    }
  };

  // ── Change role ────────────────────────────────────────────────────────────
  const handleRoleChange = async (userId, currentRole, userName) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change "${userName}" role to ${newRole}?`)) return;

    setActionId(userId);
    try {
      const data = await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        body:   JSON.stringify({ role: newRole }),
      });
      if (data.success) {
        setUsers(prev => prev.map(u =>
          u._id === userId ? { ...u, role: newRole } : u
        ));
        showToast(`${userName} is now ${newRole}`);
      } else {
        showToast(data.error || 'Role change failed', 'error');
      }
    } catch (err) {
      showToast('Role change failed', 'error');
    } finally {
      setActionId(null);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const styles = {
    toast: {
      position:     'fixed',
      bottom:       '2rem',
      right:        '2rem',
      padding:      '12px 20px',
      borderRadius: 8,
      fontSize:     13,
      fontFamily:   'monospace',
      zIndex:       999,
      animation:    'fadeUp 0.3s ease',
    },
    tableWrap: {
      background:   'var(--card)',
      border:       '1px solid var(--border)',
      borderRadius: 10,
      overflow:     'hidden',
    },
    tableHeader: {
      padding:        '1rem 1.5rem',
      borderBottom:   '1px solid var(--border)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
    },
    th: {
      textAlign:    'left',
      fontSize:     11,
      color:        'var(--muted)',
      fontFamily:   'var(--mono)',
      textTransform:'uppercase',
      letterSpacing: 1,
      padding:      '0.75rem 1.5rem',
      borderBottom: '1px solid var(--border)',
      fontWeight:   400,
    },
    td: {
      padding:  '1rem 1.5rem',
      fontSize: 14,
    },
    btnDelete: {
      background:   'rgba(230,57,70,0.1)',
      border:       '1px solid rgba(230,57,70,0.3)',
      color:        '#e63946',
      borderRadius: 6,
      padding:      '5px 14px',
      fontSize:     12,
      fontFamily:   'monospace',
      cursor:       'pointer',
      transition:   'background 0.15s',
    },
    btnRole: {
      background:   'rgba(255,255,255,0.04)',
      border:       '1px solid var(--border)',
      color:        'var(--muted)',
      borderRadius: 6,
      padding:      '5px 14px',
      fontSize:     12,
      fontFamily:   'monospace',
      cursor:       'pointer',
      transition:   'background 0.15s, color 0.15s',
      marginRight:  8,
    },
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount  = users.filter(u => u.role === 'user').length;

  return (
  <>
    {/* Toast notification */}
    {toast && (
      <div style={{
        ...styles.toast,
        background: toast.type === 'error'
          ? 'rgba(230,57,70,0.15)' : 'rgba(46,196,182,0.15)',
        border: `1px solid ${toast.type === 'error'
          ? '#7a1a20' : 'rgba(46,196,182,0.3)'}`,
        color: toast.type === 'error' ? '#e63946' : '#2ec4b6',
      }}>
        {toast.type === 'error' ? '✕' : '✓'} {toast.message}
      </div>
    )}

    {/* ── Constrained content wrapper ── */}
    <div style={{
    maxWidth:  1100,
    margin:    '0 auto',
    width:     '100%',
    paddingTop: '2rem',
    }}>

      {/* Page header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between' }}>
          <div>
            <h1>User Management</h1>
            <p>Manage accounts, roles and access control</p>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11,
            color: 'var(--muted)', textAlign: 'right', lineHeight: 1.8 }}>
            <span style={{ color: 'var(--red)' }}>{adminCount}</span> admin
            {adminCount !== 1 ? 's' : ''} &nbsp;·&nbsp;
            <span style={{ color: 'var(--green)' }}>{userCount}</span> user
            {userCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{loading ? '—' : users.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Admins</div>
          <div className="stat-value red">{loading ? '—' : adminCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Regular Users</div>
          <div className="stat-value green">{loading ? '—' : userCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Alerts Enabled</div>
          <div className="stat-value amber">
            {loading ? '—' : users.filter(u => u.receiveAlerts).length}
          </div>
        </div>
      </div>

      {/* Users table */}
      <div style={styles.tableWrap}>
        <div style={styles.tableHeader}>
          <h2 style={{ fontSize: 14, fontWeight: 600 }}>All Users</h2>
          <span style={{ fontSize: 12, color: 'var(--muted)',
            fontFamily: 'var(--mono)' }}>
            {users.length} total
          </span>
        </div>

        {loading ? (
          <div className="loading pulse">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="empty">No users found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Alerts</th>
                <th style={styles.th}>Joined</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u._id === user?.id;
                const isBusy = actionId === u._id;

                return (
                  <tr key={u._id} style={{
                    borderTop:  i > 0 ? '1px solid var(--border)' : 'none',
                    opacity:    isBusy ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                    background: isSelf
                      ? 'rgba(230,57,70,0.03)' : 'transparent',
                  }}>

                    {/* Name */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex',
                        alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30,
                          borderRadius: '50%',
                          background: u.role === 'admin'
                            ? 'rgba(230,57,70,0.15)'
                            : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${u.role === 'admin'
                            ? 'rgba(230,57,70,0.3)' : 'var(--border)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          color: u.role === 'admin'
                            ? 'var(--red)' : 'var(--muted)',
                          fontFamily: 'var(--mono)',
                          flexShrink: 0,
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14,
                            color: 'var(--text)', fontWeight: 500 }}>
                            {u.name}
                          </div>
                          {isSelf && (
                            <div style={{ fontSize: 10,
                              color: 'var(--red)',
                              fontFamily: 'var(--mono)',
                              letterSpacing: 1 }}>
                              YOU
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={{ ...styles.td, color: 'var(--muted)',
                      fontFamily: 'var(--mono)', fontSize: 12 }}>
                      {u.email}
                    </td>

                    {/* Role */}
                    <td style={styles.td}>
                      {u.role === 'admin' ? (
                        <span className="badge badge-danger">
                          <span className="dot" /> admin
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <span className="dot" /> user
                        </span>
                      )}
                    </td>

                    {/* Alerts */}
                    <td style={styles.td}>
                      {u.receiveAlerts ? (
                        <span className="badge badge-success">on</span>
                      ) : (
                        <span style={{
                          background:   'rgba(255,255,255,0.03)',
                          border:       '1px solid var(--border)',
                          color:        'var(--muted)',
                          padding:      '3px 10px',
                          borderRadius: 20,
                          fontSize:     12,
                          fontFamily:   'var(--mono)',
                        }}>
                          off
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td style={{ ...styles.td,
                      color: 'var(--muted)', fontSize: 12 }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td style={styles.td}>
                      {isSelf ? (
                        <span style={{ fontSize: 12,
                          color: 'var(--muted)',
                          fontFamily: 'var(--mono)' }}>
                          — current session
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            disabled={isBusy}
                            onClick={() =>
                              handleRoleChange(u._id, u.role, u.name)}
                            style={styles.btnRole}
                            onMouseOver={e => {
                              e.target.style.color = 'var(--text)';
                              e.target.style.borderColor = '#3a4155';
                            }}
                            onMouseOut={e => {
                              e.target.style.color = 'var(--muted)';
                              e.target.style.borderColor = 'var(--border)';
                            }}
                          >
                            {isBusy ? '...' :
                              u.role === 'admin'
                                ? '↓ Make User' : '↑ Make Admin'}
                          </button>

                          <button
                            disabled={isBusy}
                            onClick={() => handleDelete(u._id, u.name)}
                            style={styles.btnDelete}
                            onMouseOver={e =>
                              e.target.style.background =
                                'rgba(230,57,70,0.2)'}
                            onMouseOut={e =>
                              e.target.style.background =
                                'rgba(230,57,70,0.1)'}
                          >
                            {isBusy ? '...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>{/* end constrained wrapper */}

    <style>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </>
);
}