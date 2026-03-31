import React from 'react';
import { BrowserRouter as Router, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Crops from './pages/Crops';
import Weather from './pages/Weather';
import Soil from './pages/Soil';
import Recommendations from './pages/Recommendations';
import Dashboard from './pages/Dashboard';
import ToastProvider from './components/ToastProvider';

function Sidebar() {
  const location = useLocation();
  const pathname = location?.pathname || '/';

  const steps = [
    { to: '/', label: 'Crop Management' },
    { to: '/weather', label: 'Weather Data' },
    { to: '/soil', label: 'Soil Monitoring' },
    { to: '/recommendations', label: 'Recommendations' },
  ];

  const activeIndex = steps.findIndex((s) => (s.to === '/' ? pathname === '/' : pathname.startsWith(s.to)));

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">Agriculture</div>
        <div className="logo-name">Smart Farm<br/>Platform</div>
        <div className="logo-sub">v1.0 · Microservices</div>
      </div>
      <nav className="nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon" aria-hidden="true">📊</span>
          <span>Advanced Dashboard</span>
        </NavLink>
        <div className="nav-section">Process</div>
        <div className="nav-steps" aria-label="Services process">
          {steps.map((s, idx) => {
            const state = idx < activeIndex ? 'complete' : (idx === activeIndex ? 'active' : 'upcoming');
            const isLast = idx === steps.length - 1;

            return (
              <NavLink
                key={s.to}
                to={s.to}
                end={s.to === '/'}
                className={({ isActive }) => {
                  const active = isActive || (s.to === '/' ? pathname === '/' : pathname.startsWith(s.to));
                  const derived = active ? 'active' : state;
                  return `step-link ${derived}`;
                }}
              >
                <span className="step-marker" aria-hidden="true">
                  <span className="step-dot" />
                  {!isLast ? <span className="step-line" /> : null}
                </span>
                <span className="step-content">
                  <span className="step-title">{s.label}</span>
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
      <div className="sidebar-footer">
        <span className="status-dot"></span>
        <span className="status-text">Services running</span>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Crops />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/soil" element={<Soil />} />
            <Route path="/recommendations" element={<Recommendations />} />
          </Routes>
        </main>
      </Router>
    </ToastProvider>
  );
}
