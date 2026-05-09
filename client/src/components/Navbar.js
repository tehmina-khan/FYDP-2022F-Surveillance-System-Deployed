import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location   = useLocation();
  const navigate   = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-dot" />
          Surveillance System
        </Link>

        {/* Hamburger */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        {/* Nav links */}
        <ul className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <li>
            <Link to="/" className={isActive('/') ? 'active' : ''}
              onClick={() => setMenuOpen(false)}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className={isActive('/about') ? 'active' : ''}
              onClick={() => setMenuOpen(false)}>
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" className={isActive('/contact') ? 'active' : ''}
              onClick={() => setMenuOpen(false)}>
              Contact Us
            </Link>
          </li>

          {isLoggedIn ? (
            /* ── Logged-in: show profile chip ── */
            <li>
              <button
                onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         8,
                  background:  'rgba(255,255,255,0.04)',
                  border:      '1px solid var(--border)',
                  borderRadius: 20,
                  padding:     '5px 14px 5px 6px',
                  cursor:      'pointer',
                  color:       'var(--text)',
                  fontSize:    13,
                  fontFamily:  'var(--sans)',
                  transition:  'border-color 0.2s',
                }}
                onMouseOver={e =>
                  e.currentTarget.style.borderColor = '#3a4155'}
                onMouseOut={e =>
                  e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Avatar or initial */}
                <div style={{
                  width:          26, height: 26,
                  borderRadius:   '50%',
                  background:     user?.profilePicture
                    ? 'transparent' : 'rgba(230,57,70,0.15)',
                  border:         '1px solid rgba(230,57,70,0.3)',
                  overflow:       'hidden',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       11,
                  color:          'var(--red)',
                  fontFamily:     'var(--mono)',
                  flexShrink:     0,
                }}>
                  {user?.profilePicture
                    ? <img src={user.profilePicture} alt="avatar"
                        style={{ width: '100%', height: '100%',
                          objectFit: 'cover' }} />
                    : user?.name?.charAt(0).toUpperCase() || '?'
                  }
                </div>
                <span style={{ maxWidth: 100, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name?.split(' ')[0] || 'Profile'}
                </span>
              </button>
            </li>
          ) : (
            /* ── Logged-out: show Login + Signup ── */
            <>
              <li>
                <Link to="/login"
                  className={`nav-login ${isActive('/login') ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="nav-signup"
                  onClick={() => setMenuOpen(false)}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>

      </div>
    </nav>
  );
}