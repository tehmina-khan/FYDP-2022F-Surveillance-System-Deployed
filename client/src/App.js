import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PendingApprovals from './pages/PendingApprovals';
import Profile from './pages/Profile';

// Protected dashboard pages
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import IncidentList from './pages/IncidentList';
import IncidentDetail from './pages/IncidentDetail';

// Dashboard sidebar layout
function DashboardLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          ◉ FYDP 2022 Fall
          <span>Violence Detection System</span>
        </div>
        <div style={{ marginTop: 'auto', padding: '0 0 0.5rem' }}>
          <NavLink to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">◉</span> Profile
          </NavLink>
          
        </div>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          end
        >
          <span className="nav-icon">▣</span> Dashboard
        </NavLink>

        <NavLink
          to="/incidents"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon">☰</span> Incidents
        </NavLink>

        {/* Only visible to admins */}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">⚙</span> Admin Dashboard
          </NavLink>
        )}

        {/* Pending approvals link */}
        {user?.role === 'admin' && (
          <NavLink
            to="/pending"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">⏳</span> Approvals
          </NavLink>
        )}

        <div style={{ marginTop: 'auto', padding: '0 0 1rem' }}>
          <button
            onClick={logout}
            className="nav-link"
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'var(--muted)',
            }}
          >
            <span className="nav-icon">⏻</span> Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/incidents" element={<IncidentList />} />
          <Route path="/incident/:id" element={<IncidentDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/pending" element={<PendingApprovals />} /> {/* ← added */}
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected dashboard routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}