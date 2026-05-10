import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BASE = "https://fydp-2022f-surveillance-system-deployed-production.up.railway.app";    // ← full URL, no proxy needed

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async () => {
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Save token + user info
      login(data.token, data.user);
      navigate('/dashboard');

    } catch (err) {
      setError('Could not connect to server. Is it running?');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    background: '#0f1318',
    border: '1px solid #1e2530',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#dde3ee',
    fontSize: 14,
    fontFamily: "'Barlow', sans-serif",
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    color: '#5a6478',
    fontFamily: 'monospace',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#080b10', fontFamily: "'Barlow', sans-serif" }}>

      <div style={{
        background: '#0f1318',
        border: '1px solid #1e2530',
        borderRadius: 12,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 400,
        margin: '0 1rem',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13,
            color: '#e63946', letterSpacing: 3, marginBottom: 6 }}>
            ◉ CCTV SENTINEL
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700,
            color: '#dde3ee', marginBottom: 6 }}>
            Welcome Back
          </h1>
          <p style={{ color: '#5a6478', fontSize: 13 }}>
            Sign in to access the dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(230,57,70,0.1)',
            border: '1px solid #7a1a20',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#e63946',
            marginBottom: '1.25rem',
            fontFamily: 'monospace',
          }}>
            ✕ {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="admin@cctv.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '13px',
              background: loading ? '#7a1a20' : '#e63946',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Barlow', sans-serif",
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 13,
            color: '#5a6478', marginTop: '0.25rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#e63946',
              textDecoration: 'none', fontWeight: 600 }}>
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}