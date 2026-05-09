import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Signup() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);   // ← show success state

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('All fields are required'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return;
    }

    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:     form.name,
          email:    form.email,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Show pending approval message — no redirect
      setDone(true);

    } catch (err) {
      setError('Could not connect to server');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: '#0f1318',
    border: '1px solid #1e2530', borderRadius: 8,
    padding: '12px 16px', color: '#dde3ee',
    fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: 'none',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, color: '#5a6478',
    fontFamily: 'monospace', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 6,
  };

  // ── Pending approval screen ────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#080b10', fontFamily: "'Barlow', sans-serif" }}>
        <div style={{
          background: '#0f1318', border: '1px solid #1e2530',
          borderRadius: 12, padding: '2.5rem',
          width: '100%', maxWidth: 400,
          margin: '0 1rem', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(244,162,97,0.1)',
            border: '1px solid rgba(244,162,97,0.3)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            fontSize: 22,
          }}>
            ⏳
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700,
            color: '#dde3ee', marginBottom: 8 }}>
            Account Pending Approval
          </h2>
          <p style={{ color: '#5a6478', fontSize: 14,
            lineHeight: 1.75, marginBottom: '1.5rem' }}>
            Your account has been created successfully.
            An admin will review and approve your request.
            You will be able to log in once approved.
          </p>
          <Link to="/login" style={{
            display: 'inline-block',
            background: 'none',
            border: '1px solid #1e2530',
            borderRadius: 8, padding: '10px 24px',
            color: '#5a6478', fontSize: 13,
            textDecoration: 'none',
            fontFamily: 'monospace',
          }}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#080b10', fontFamily: "'Barlow', sans-serif" }}>
      <div style={{
        background: '#0f1318', border: '1px solid #1e2530',
        borderRadius: 12, padding: '2.5rem',
        width: '100%', maxWidth: 420, margin: '0 1rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13,
            color: '#e63946', letterSpacing: 3, marginBottom: 6 }}>
            ◉ CCTV SENTINEL
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700,
            color: '#dde3ee', marginBottom: 6 }}>
            Create Account
          </h1>
          <p style={{ color: '#5a6478', fontSize: 13 }}>
            Register to request access
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(230,57,70,0.1)',
            border: '1px solid #7a1a20', borderRadius: 8,
            padding: '10px 14px', fontSize: 13,
            color: '#e63946', marginBottom: '1.25rem',
            fontFamily: 'monospace',
          }}>
            ✕ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="John Doe" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="john@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Min. 6 characters" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input type="password" name="confirm" value={form.confirm}
              onChange={handleChange}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••" style={inputStyle} />
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            marginTop: '0.5rem', width: '100%', padding: '13px',
            background: loading ? '#7a1a20' : '#e63946',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'Barlow', sans-serif",
          }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13,
            color: '#5a6478', marginTop: '0.25rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#e63946',
              textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}