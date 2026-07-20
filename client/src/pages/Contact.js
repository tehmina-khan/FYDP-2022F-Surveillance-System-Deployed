import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const s = {
  page: {
    background: 'var(--bg)',
    minHeight:  '100vh',
    color:      'var(--text)',
    fontFamily: 'var(--sans)',
  },
  wrap: {
    maxWidth: 600,
    margin:   '0 auto',
    padding:  '120px 2rem 5rem',
  },
  eyebrow: {
    fontFamily:    'var(--mono)',
    fontSize:      11,
    color:         'var(--red)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom:  '1rem',
  },
  h1: {
    fontSize:     'clamp(2rem, 5vw, 2.8rem)',
    fontWeight:   700,
    marginBottom: '0.75rem',
    color:        'var(--text)',
  },
  subtitle: {
    fontSize:     15,
    color:        'var(--muted)',
    lineHeight:   1.75,
    marginBottom: '2.5rem',
  },
  label: {
    display:       'block',
    fontSize:      11,
    color:         'var(--muted)',
    fontFamily:    'var(--mono)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  7,
  },
  input: {
    width:        '100%',
    background:   'var(--surface)',
    border:       '1px solid var(--border)',
    borderRadius: 8,
    padding:      '12px 16px',
    color:        'var(--text)',
    fontSize:     14,
    fontFamily:   'var(--sans)',
    outline:      'none',
    transition:   'border-color 0.2s',
    display:      'block',
  },
};

export default function Contact() {
  const [form, setForm]         = useState({ name: '', email: '', message: '' });
  const [errors, setErrors]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused]   = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim())                        e.name    = 'Name is required';
    if (!form.email.trim())                       e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))   e.email   = 'Enter a valid email';
    if (!form.message.trim())                     e.message = 'Message is required';
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    console.log('Contact form submitted:', form);
    setSubmitted(true);
  };

  const fieldStyle = (name) => ({
    ...s.input,
    borderColor: errors[name]
      ? '#7a1a20'
      : focused === name
        ? '#3a4155'
        : '#1e2530',
  });

  if (submitted) {
    return (
      <div style={s.page}>
        <Navbar />
        <div style={s.wrap}>
          // Success box
        <div style={{
          background:   'var(--surface)',
          border:       '1px solid var(--border)',
          borderRadius: 12,
          padding:      '3rem 2rem',
          textAlign:    'center',
          marginTop:    '2rem',
          boxShadow:    '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            width:          56, height: 56,
            borderRadius:   '50%',
            background:     'rgba(46,196,182,0.1)',
            border:         '1px solid rgba(46,196,182,0.3)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 1.25rem',
            fontSize:       22,
            color:          'var(--green)',
          }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 700,
            color: 'var(--text)', marginBottom: 8 }}>
            Message Sent
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14,
            lineHeight: 1.7, marginBottom: '1.75rem' }}>
            Thank you for reaching out.
            We will get back to you shortly.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ name: '', email: '', message: '' });
            }}
            style={{
              background:   'none',
              border:       '1px solid var(--border)',
              borderRadius: 8,
              padding:      '10px 22px',
              color:        'var(--muted)',
              fontSize:     13,
              cursor:       'pointer',
              fontFamily:   'var(--sans)',
            }}
          >
            Send another message
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.wrap}>

        {/* Header */}
        <p style={s.eyebrow}>Get In Touch</p>
        <h1 style={s.h1}>Contact Us</h1>
        <p style={s.subtitle}>
          Have a question about the project, or want to collaborate?
          Fill out the form below and we will respond as soon as possible.
        </p>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Name */}
          <div>
            <label style={s.label}>Your Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused('')}
              placeholder="John Doe"
              style={fieldStyle('name')}
            />
            {errors.name && (
              <p style={{ fontSize: 12, color: '#e63946',
                marginTop: 5, fontFamily: 'monospace' }}>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label style={s.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              placeholder="john@example.com"
              style={fieldStyle('email')}
            />
            {errors.email && (
              <p style={{ fontSize: 12, color: '#e63946',
                marginTop: 5, fontFamily: 'monospace' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label style={s.label}>Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              onFocus={() => setFocused('message')}
              onBlur={() => setFocused('')}
              placeholder="Write your message here..."
              rows={5}
              style={{ ...fieldStyle('message'), resize: 'vertical' }}
            />
            {errors.message && (
              <p style={{ fontSize: 12, color: '#e63946',
                marginTop: 5, fontFamily: 'monospace' }}>
                {errors.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <div style={{ paddingTop: '0.25rem' }}>
            <button
              onClick={handleSubmit}
              style={{
                background: '#e63946',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '13px 32px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Barlow', sans-serif",
                transition: 'opacity 0.2s, transform 0.15s',
              }}
              onMouseOver={e => { e.target.style.opacity = '0.88'; e.target.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }}
            >
              Send Message
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}