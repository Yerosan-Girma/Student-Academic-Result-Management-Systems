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
        <NavLink className="navbar-brand sam-brand" to="/dashboard" onClick={() => setOpen(false)}>
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
                Logged in as: {displayName}
              </div>
            ) : null}
            <button className="btn btn-outline-light btn-sm" type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
