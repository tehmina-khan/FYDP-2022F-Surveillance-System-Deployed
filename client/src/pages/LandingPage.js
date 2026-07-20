import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-root">
      <Navbar />

      <section className="hero" id="home">
        <div className="hero-grid" aria-hidden="true" />
        <div className="scanline"  aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            AI-Powered &nbsp;·&nbsp; Real-Time Detection
          </div>

          <h1 className="hero-title">
            AI-Based Violence<br />
            <span className="hero-title-accent">Detection System</span>
          </h1>

          <p className="hero-desc">
            A smart CCTV surveillance platform that uses deep learning to detect
            violent activity in real time. Instant alerts via email and SMS keep
            security teams informed the moment an incident occurs.
          </p>

          <div className="hero-actions">
            <Link to="/login" className="btn-primary">
              Get Started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/about" className="btn-ghost">Learn More</Link>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">97%</span>
              <span className="stat-lbl">Detection Accuracy</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">&lt;5s</span>
              <span className="stat-lbl">Response Time</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-num">24/7</span>
              <span className="stat-lbl">Live Monitoring</span>
            </div>
          </div>
        </div>

        {/* Camera graphic — unchanged from before */}
        <div className="hero-visual" aria-hidden="true">
          <div className="camera-frame">
            <div className="camera-inner">
              <div className="camera-lens">
                <div className="lens-ring" />
                <div className="lens-core" />
              </div>
              <div className="camera-label">CAM_01</div>
              <div className="camera-rec">
                <span className="rec-dot" /> REC
              </div>
            </div>
            <div className="camera-scan" />
          </div>
          <div className="detection-box">
            <div className="det-corner tl" /><div className="det-corner tr" />
            <div className="det-corner bl" /><div className="det-corner br" />
            <span className="det-label">Anomaly Detected</span>
          </div>
        </div>

      </section>
    </div>
  );
}