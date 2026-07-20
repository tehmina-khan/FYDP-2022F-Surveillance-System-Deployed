import React from 'react';
import Navbar from '../components/Navbar';

const s = {
  page: {
    background: 'var(--bg)',
    minHeight:  '100vh',
    color:      'var(--text)',
    fontFamily: 'var(--sans)',
  },
  wrap: {
    maxWidth: 860,
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
    lineHeight:   1.2,
    marginBottom: '1.25rem',
    color:        'var(--text)',
  },
  accent: { color: 'var(--red)' },
  lead: {
    fontSize:     16,
    lineHeight:   1.85,
    color:        'var(--muted)',
    maxWidth:     680,
    marginBottom: '3.5rem',
  },
  divider: {
    border:    'none',
    borderTop: '1px solid var(--border)',
    margin:    '3rem 0',
  },
  h2: {
    fontSize:     18,
    fontWeight:   600,
    color:        'var(--text)',
    marginBottom: '1.5rem',
  },
  grid3: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap:                 '1rem',
    marginBottom:        '3.5rem',
  },
  card: {
    background:   'var(--surface)',
    border:       '1px solid var(--border)',
    borderRadius: 10,
    padding:      '1.5rem',
    boxShadow:    '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardIcon: {
    fontSize:     22,
    marginBottom: '0.75rem',
    display:      'block',
    color:        'var(--red)',
  },
  cardTitle: {
    fontSize:     14,
    fontWeight:   600,
    color:        'var(--text)',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize:   13,
    color:      'var(--muted)',
    lineHeight: 1.7,
  },
  stackGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap:                 '0.75rem',
  },
  stackCard: {
    background:   'var(--surface)',
    border:       '1px solid var(--border)',
    borderRadius: 8,
    padding:      '1rem 1.25rem',
    boxShadow:    '0 2px 8px rgba(0,0,0,0.04)',
  },
  stackLayer: {
    fontSize:      10,
    color:         'var(--muted)',
    fontFamily:    'var(--mono)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  5,
  },
  stackTech: {
    fontSize:   13,
    color:      'var(--text)',
    fontWeight: 500,
  },
};

const features = [
  {
    icon: '◎',
    title: 'Real-Time Detection',
    desc: 'Continuously analyzes live camera feeds frame by frame using a 3D CNN model, flagging violent activity within milliseconds.',
  },
  {
    icon: '⬡',
    title: 'Reduces Cognitive Load',
    desc: 'Security personnel no longer watch hours of footage manually. The AI handles continuous monitoring and only escalates confirmed threats.',
  },
  {
    icon: '◈',
    title: 'Instant Alerts',
    desc: 'On confirmed detection, email and SMS notifications are dispatched automatically with a snapshot and link to the incident.',
  },
  {
    icon: '▣',
    title: 'Incident Dashboard',
    desc: 'All detected incidents are logged in a secure web dashboard with video playback, snapshot view, and confidence scores.',
  },
  {
    icon: '☁',
    title: 'Cloud Storage',
    desc: 'Video clips and snapshots are uploaded to Cloudinary automatically — no risk of losing evidence if the local machine goes offline.',
  },
  {
    icon: '⬤',
    title: 'Secure Access',
    desc: 'JWT-based authentication ensures only authorized users can view incident records or access the monitoring dashboard.',
  },
];

const stack = [
  { layer: 'AI Model',  tech: 'PyTorch · R3D-18' },
  { layer: 'Backend',   tech: 'Node.js · Express' },
  { layer: 'Database',  tech: 'MongoDB' },
  { layer: 'Frontend',  tech: 'React · React Router' },
  { layer: 'Cloud',     tech: 'Cloudinary' },
  { layer: 'Alerts',    tech: 'Nodemailer · Twilio' },
  { layer: 'Auth',      tech: 'JWT · bcryptjs' },
  { layer: 'Camera',    tech: 'OpenCV · Python' },
];

export default function About() {
  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.wrap}>

        {/* Header */}
        <p style={s.eyebrow}>About the Project</p>
        <h1 style={s.h1}>
          Built to make surveillance<br />
          <span style={s.accent}>smarter and faster.</span>
        </h1>
        <p style={s.lead}>
          Traditional CCTV monitoring requires security staff to watch live feeds
          continuously — an exhausting and error-prone task. This system replaces
          that process with an AI model that watches every frame automatically,
          detects violence in real time, and alerts the right people instantly.
          Human attention is reserved for responding, not watching.
        </p>

        <hr style={s.divider} />

        {/* Feature cards */}
        <h2 style={s.h2}>What the system does</h2>
        <div style={s.grid3}>
          {features.map(f => (
            <div key={f.title} style={s.card}>
              <span style={s.cardIcon}>{f.icon}</span>
              <div style={s.cardTitle}>{f.title}</div>
              <div style={s.cardDesc}>{f.desc}</div>
            </div>
          ))}
        </div>

        <hr style={s.divider} />

        {/* How it works */}
        <h2 style={s.h2}>How it works</h2>
        <div style={{ marginBottom: '3.5rem' }}>
          {[
            { step: '01', title: 'Camera captures live footage',
              desc: 'OpenCV reads frames from a connected webcam or CCTV feed continuously.' },
            { step: '02', title: 'AI model analyses each clip',
              desc: 'Every 24 frames are passed through the R3D-18 model. Motion detection filters out idle scenes before inference runs.' },
            { step: '03', title: 'Violence confirmed',
              desc: 'If the model predicts violence with high confidence across consecutive clips, an alert is triggered.' },
            { step: '04', title: 'Incident saved and team notified',
              desc: 'A video clip and snapshot are saved to the cloud. Email and SMS alerts are sent. The incident appears on the dashboard.' },
          ].map((item, i) => (
            <div key={item.step} style={{
              display: 'flex',
              gap: '1.5rem',
              paddingBottom: i < 3 ? '1.75rem' : 0,
              borderBottom: i < 3 ? '1px solid #1e2530' : 'none',
              marginBottom: i < 3 ? '1.75rem' : 0,
            }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize:   13,
              color:      'var(--red)',
              minWidth:   28,
              paddingTop: 2,
            }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600,
                  color: 'var(--text)', marginBottom: 5 }}> 
                  {item.title}
                </div>
                <div style={{ fontSize: 14, color: 'var(--muted)',  
                  lineHeight: 1.7 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr style={s.divider} />

        {/* Tech stack */}
        <h2 style={s.h2}>Technology stack</h2>
        <div style={s.stackGrid}>
          {stack.map(item => (
            <div key={item.layer} style={s.stackCard}>
              <div style={s.stackLayer}>{item.layer}</div>
              <div style={s.stackTech}>{item.tech}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}