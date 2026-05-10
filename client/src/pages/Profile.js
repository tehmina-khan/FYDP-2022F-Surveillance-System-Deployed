import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

const BASE = "https://fydp-2022f-surveillance-system-deployed-production.up.railway.app";    // ← full URL, no proxy needed

const s = {
  section: {
    background:   'var(--card)',
    border:       '1px solid var(--border)',
    borderRadius: 10,
    padding:      '1.5rem',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize:     13,
    fontWeight:   600,
    color:        'var(--text)',
    marginBottom: '1.25rem',
    paddingBottom:'0.75rem',
    borderBottom: '1px solid var(--border)',
    fontFamily:   'var(--mono)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  label: {
    display:       'block',
    fontSize:      11,
    color:         'var(--muted)',
    fontFamily:    'var(--mono)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  6,
  },
  input: {
    width:       '100%',
    background:  '#0a0d12',
    border:      '1px solid var(--border)',
    borderRadius: 8,
    padding:     '11px 14px',
    color:       'var(--text)',
    fontSize:    14,
    fontFamily:  'var(--sans)',
    outline:     'none',
  },
  row: {
    display:  'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:      '1rem',
  },
  btnPrimary: {
    background:   'var(--red)',
    color:        '#fff',
    border:       'none',
    borderRadius: 8,
    padding:      '10px 22px',
    fontSize:     13,
    fontWeight:   600,
    cursor:       'pointer',
    fontFamily:   'var(--mono)',
    letterSpacing: 0.5,
    transition:   'opacity 0.2s',
  },
  btnGhost: {
    background:   'transparent',
    color:        'var(--muted)',
    border:       '1px solid var(--border)',
    borderRadius: 8,
    padding:      '10px 22px',
    fontSize:     13,
    cursor:       'pointer',
    fontFamily:   'var(--mono)',
    transition:   'color 0.2s, border-color 0.2s',
  },
  metaRow: {
    display:       'flex',
    justifyContent:'space-between',
    alignItems:    'center',
    padding:       '0.65rem 0',
    borderBottom:  '1px solid var(--border)',
  },
  metaKey: {
    fontSize:   12,
    color:      'var(--muted)',
    fontFamily: 'var(--mono)',
  },
  metaVal: {
    fontSize: 13,
    color:    'var(--text)',
  },
};

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position:   'fixed',
      bottom:     '2rem',
      right:      '2rem',
      padding:    '12px 20px',
      borderRadius: 8,
      fontSize:   13,
      fontFamily: 'var(--mono)',
      zIndex:     999,
      background: type === 'error'
        ? 'rgba(230,57,70,0.15)' : 'rgba(46,196,182,0.15)',
      border: `1px solid ${type === 'error'
        ? '#7a1a20' : 'rgba(46,196,182,0.3)'}`,
      color: type === 'error' ? 'var(--red)' : 'var(--green)',
    }}>
      {type === 'error' ? '✕' : '✓'} {msg}
    </div>
  );
}

export default function Profile() {
  const { user: authUser, login } = useAuth();
  const fileRef = useRef();

  // Profile state
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ name: '', phoneNumber: '' });
  const [preview,  setPreview]  = useState(null);
  const [imgFile,  setImgFile]  = useState(null);
  const [alerts,       setAlerts]       = useState(true);
  const [alertSaving,  setAlertSaving]  = useState(false);

  // Password state
  const [pwForm,   setPwForm]   = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [pwSaving, setPwSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/api/users/profile')
      .then(d => {
        setProfile(d.user);
        setAlerts(d.user?.receiveAlerts ?? true); 
        setForm({
          name:        d.user.name        || '',
          phoneNumber: d.user.phoneNumber || '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Image preview ──────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name',        form.name);
      fd.append('phoneNumber', form.phoneNumber);
      if (imgFile) fd.append('profilePicture', imgFile);

      const res  = await fetch(`${BASE}/api/users/profile`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('cctv_token')}` },
        body:    fd,
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.error || 'Update failed', 'error'); return;
      }

      setProfile(data.user);
      setPreview(null);
      setImgFile(null);
      setEditing(false);

      // Update AuthContext so navbar name refreshes
      const token = localStorage.getItem('cctv_token');
      login(token, {
        ...authUser,
        name:           data.user.name,
        profilePicture: data.user.profilePicture,
      });

      showToast('Profile updated successfully');

    } catch (err) {
      showToast('Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };
  // Toggle Alert Pref

  const handleAlertToggle = async () => {
  setAlertSaving(true);
  try {
    const data = await apiFetch('/api/users/alerts-preference', {
      method: 'PUT',
      body:   JSON.stringify({ receiveAlerts: !alerts }),
    });
    if (data.success) {
      setAlerts(!alerts);
      showToast(`Alerts ${!alerts ? 'enabled' : 'disabled'} successfully`);
    } else {
      showToast(data.error || 'Failed to update', 'error');
    }
  } catch (err) {
    showToast('Failed to update alert preference', 'error');
  } finally {
    setAlertSaving(false);
  }
};

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      showToast('All password fields are required', 'error'); return;
    }
    if (pwForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error'); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('New passwords do not match', 'error'); return;
    }

    setPwSaving(true);
    try {
      const data = await apiFetch('/api/users/change-password', {
        method: 'PUT',
        body:   JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword:     pwForm.newPassword,
        }),
      });

      if (!data.success) {
        showToast(data.error || 'Password change failed', 'error'); return;
      }

      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully');

    } catch (err) {
      showToast('Password change failed', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) return <div className="loading pulse">Loading profile...</div>;
  if (!profile) return <div className="empty">Profile not found.</div>;

  const avatarUrl  = preview || profile.profilePicture;
  const initials   = profile.name?.charAt(0).toUpperCase() || '?';

  return (
    <>
      <Toast msg={toast.msg} type={toast.type} />

      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>

        {/* ── Page header ── */}
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your account information and security settings</p>
        </div>

        {/* ── Avatar + account info ── */}
        <div style={{ ...s.section, display: 'flex',
          alignItems: 'flex-start', gap: '1.5rem',
          flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: avatarUrl ? 'transparent' : 'rgba(230,57,70,0.1)',
              border: '2px solid var(--border)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28, color: 'var(--red)',
              fontFamily: 'var(--mono)',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile"
                    style={{ width: '100%', height: '100%',
                      objectFit: 'cover' }} />
                : initials
              }
            </div>
            {editing && (
              <>
                <button
                  onClick={() => fileRef.current.click()}
                  style={{
                    position:   'absolute',
                    bottom:     0, right: 0,
                    width:      26, height: 26,
                    borderRadius: '50%',
                    background: 'var(--red)',
                    border:     'none',
                    color:      '#fff',
                    fontSize:   13,
                    cursor:     'pointer',
                    display:    'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Change photo"
                >
                  ✎
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </>
            )}
          </div>

          {/* Account meta */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 18, fontWeight: 700,
              color: 'var(--text)', marginBottom: 4 }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)',
              marginBottom: '1rem' }}>
              {profile.email}
            </div>

            <div style={s.metaRow}>
              <span style={s.metaKey}>User ID</span>
              <span style={{ ...s.metaVal, fontFamily: 'var(--mono)',
                fontSize: 11, color: 'var(--muted)' }}>
                {profile._id}
              </span>
            </div>
            <div style={s.metaRow}>
              <span style={s.metaKey}>Role</span>
              <span className={`badge ${profile.role === 'admin'
                ? 'badge-danger' : 'badge-success'}`}>
                <span className="dot" /> {profile.role}
              </span>
            </div>
            <div style={{ ...s.metaRow, borderBottom: 'none' }}>
              <span style={s.metaKey}>Member Since</span>
              <span style={s.metaVal}>
                {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Edit profile form ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Profile Information</div>

          {editing ? (
            <>
              <div style={{ ...s.row, marginBottom: '1rem' }}>
                <div>
                  <label style={s.label}>Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={s.input}
                  />
                </div>
                <div>
                  <label style={s.label}>Phone Number</label>
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="+92 300 0000000"
                    style={s.input}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{ ...s.btnPrimary, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setPreview(null);
                    setImgFile(null);
                    setForm({
                      name:        profile.name        || '',
                      phoneNumber: profile.phoneNumber || '',
                    });
                  }}
                  style={s.btnGhost}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'grid',
                gridTemplateColumns: '1fr 1fr', gap: '1rem',
                marginBottom: '1.25rem' }}>
                {[
                  { label: 'Full Name',     value: profile.name },
                  { label: 'Email Address', value: profile.email },
                  { label: 'Phone Number',
                    value: profile.phoneNumber || '—' },
                  { label: 'Account Status',
                    value: profile.approvalStatus },
                ].map(item => (
                  <div key={item.label}>
                    <div style={s.label}>{item.label}</div>
                    <div style={{ fontSize: 14, color: 'var(--text)',
                      padding: '8px 0' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setEditing(true)} style={s.btnGhost}>
                ✎ Edit Profile
              </button>
            </>
          )}
        </div>

        {/* ── Alert Preferences ── */}
        <div style={s.section}>
        <div style={s.sectionTitle}>Notification Preferences</div>

        <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            flexWrap:       'wrap',
            gap:            '1rem',
        }}>
            <div>
            <div style={{ fontSize: 14, fontWeight: 600,
                color: 'var(--text)', marginBottom: 4 }}>
                Email & SMS Alerts
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)',
                lineHeight: 1.6 }}>
                Receive instant notifications when violence is detected.
                <br />
                Turning this off means you will not be emailed or texted on
                new incidents.
            </div>
            </div>

            {/* Toggle switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)',
                color: alerts ? 'var(--green)' : 'var(--muted)' }}>
                {alerts ? 'Enabled' : 'Disabled'}
            </span>
            <button
                onClick={handleAlertToggle}
                disabled={alertSaving}
                style={{
                width:        52,
                height:       28,
                borderRadius: 14,
                border:       'none',
                background:   alerts
                    ? 'var(--green)' : 'var(--border)',
                cursor:       alertSaving ? 'not-allowed' : 'pointer',
                position:     'relative',
                transition:   'background 0.3s',
                flexShrink:   0,
                }}
            >
                <div style={{
                position:   'absolute',
                top:        3,
                left:       alerts ? 26 : 3,
                width:      22,
                height:     22,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.3s',
                boxShadow:  '0 1px 4px rgba(0,0,0,0.3)',
                }} />
            </button>
            </div>
        </div>

        {/* Current status info */}
        <div style={{
            marginTop:    '1.25rem',
            padding:      '0.75rem 1rem',
            borderRadius: 8,
            background:   alerts
            ? 'rgba(46,196,182,0.06)' : 'rgba(255,255,255,0.02)',
            border:       `1px solid ${alerts
            ? 'rgba(46,196,182,0.2)' : 'var(--border)'}`,
            fontSize:     12,
            color:        alerts ? 'var(--green)' : 'var(--muted)',
            fontFamily:   'var(--mono)',
        }}>
            {alerts
            ? '◉ You will receive email and SMS alerts for all new incidents'
            : '○ You will NOT receive any notifications for new incidents'}
        </div>
        </div>

        {/* ── Change password ── */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Change Password</div>

          <div style={{ display: 'flex', flexDirection: 'column',
            gap: '1rem', maxWidth: 420 }}>

            {[
              { key: 'currentPassword', label: 'Current Password',
                placeholder: 'Enter current password' },
              { key: 'newPassword',     label: 'New Password',
                placeholder: 'Min. 6 characters' },
              { key: 'confirmPassword', label: 'Confirm New Password',
                placeholder: '••••••••' },
            ].map(field => (
              <div key={field.key}>
                <label style={s.label}>{field.label}</label>
                <input
                  type="password"
                  value={pwForm[field.key]}
                  onChange={e => setPwForm({
                    ...pwForm, [field.key]: e.target.value
                  })}
                  placeholder={field.placeholder}
                  style={s.input}
                />
              </div>
            ))}

            <div>
              <button
                onClick={handleChangePassword}
                disabled={pwSaving}
                style={{ ...s.btnPrimary, opacity: pwSaving ? 0.7 : 1 }}
              >
                {pwSaving ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}