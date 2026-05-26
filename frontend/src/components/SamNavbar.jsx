import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider.jsx';

function navLinkClass({ isActive }) {
  return `nav-link ${isActive ? 'active' : ''}`;
}

export default function SamNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const role = user?.role ?? 'Admin';
  const displayName = user?.teacher_name ?? user?.username ?? '';

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sam-navbar">
      <div className="container">
        <NavLink className="navbar-brand sam-brand d-flex align-items-center" to="/dashboard" onClick={() => setOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-mortarboard-fill me-2" viewBox="0 0 16 16">
            <path d="M8.211 2.047a.5.5 0 0 0-.422 0L1.5 5.134v5.733l5.299 3.066 5.299-3.066V5.134L8.211 2.047zM1.5 12.947V7.5l5.789 3.289.211.113a.5.5 0 0 0 .422 0l.211-.113L13.5 7.5v5.447l-5.299 3.066L1.5 12.947z"/>
          </svg>
          Student AMS <span className="sam-brand-badge ms-2">SAM</span>
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open ? 'true' : 'false'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className={navLinkClass} to="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </NavLink>
            </li>
            {role === 'Admin' ? (
              <>
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/classes" onClick={() => setOpen(false)}>
                    Classes
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/students" onClick={() => setOpen(false)}>
                    Students
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/subjects" onClick={() => setOpen(false)}>
                    Subjects
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={navLinkClass} to="/teachers" onClick={() => setOpen(false)}>
                    Teachers
                  </NavLink>
                </li>
              </>
            ) : null}
            {role === 'Subject Teacher' ? (
              <li className="nav-item">
                <NavLink className={navLinkClass} to="/marks" onClick={() => setOpen(false)}>
                  Marks
                </NavLink>
              </li>
            ) : null}
            {role === 'Homeroom Teacher' ? (
              <li className="nav-item">
                <NavLink className={navLinkClass} to="/reports" onClick={() => setOpen(false)}>
                  Reports
                </NavLink>
              </li>
            ) : null}
          </ul>

          <div className="d-flex gap-2 align-items-center">
            {displayName ? (
              <div className="sam-admin-pill small d-none d-lg-block">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-person-circle me-1" viewBox="0 0 16 16">
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                  <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                </svg>
                {displayName}
              </div>
            ) : null}
            <button className="btn btn-outline-light btn-sm sam-animated-btn" type="button" onClick={onLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-right me-1 sam-fa-icon" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-1.147 1.146a.5.5 0 0 0 .708.708l3-3z"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
