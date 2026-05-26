import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider.jsx';
import Alert from '../components/Alert.jsx';
import FullPageLoader from '../components/FullPageLoader.jsx';

function getLandingPath(currentUser) {
  if (!currentUser) return '/dashboard';
  if (currentUser.role === 'Subject Teacher') return '/marks';
  if (currentUser.role === 'Homeroom Teacher') return '/reports';
  return '/dashboard';
}

export default function Login() {
  const { user, initializing, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState(null);

  const canSubmit = useMemo(() => {
    return form.username.trim().length > 0 && form.password.trim().length > 0 && !busy;
  }, [form, busy]);

  useEffect(() => {
    if (!initializing && user) navigate(getLandingPath(user), { replace: true });
  }, [user, initializing, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setAlert(null);
    setBusy(true);
    try {
      const me = await login({ username: form.username, password: form.password });
      navigate(getLandingPath(me), { replace: true });
    } catch (err) {
      setAlert({ type: 'danger', message: err?.message || 'Login failed' });
    } finally {
      setBusy(false);
    }
  }

  if (initializing) return <FullPageLoader label="Loading..." />;

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card shadow-lg login-card border-0 page-enter">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="mb-3" style={{ fontSize: '3rem' }}>🎓</div>
                <h1 className="h3 mb-1 text-gradient">Student AMS</h1>
                <p className="text-muted mb-0">Academic Management System</p>
              </div>

              <Alert alert={alert} onClose={() => setAlert(null)} />

              <form onSubmit={onSubmit} autoComplete="off">
                <div className="mb-3">
                  <label className="form-label" htmlFor="username">
                    Username
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.002c-.001-.246-.154-.986-.832-1.664C8.516 10.68 8.235 11 8 11c-.235 0-.516-.32-.832-.336C6.168 10.014 6.001 9.774 6 9.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5z"/>
                      </svg>
                    </span>
                    <input
                      className="form-control border-start-0 ps-0"
                      id="username"
                      name="username"
                      required
                      value={form.username}
                      onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))}
                      disabled={busy}
                      placeholder="Enter username"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-lock" viewBox="0 0 16 16">
                        <path d="M5.5 8a3 3 0 1 1 6 0 3 3 0 0 1-6 0z"/>
                        <path d="M8 1a4 4 0 0 0-4 4v2.05a2.5 2.5 0 0 0 .5 4.85v.55a2.5 2.5 0 0 0 5 0v-.55a2.5 2.5 0 0 0 .5-4.85V5a4 4 0 0 0-4-4zm0 1a3 3 0 0 1 3 3v2.05a1.5 1.5 0 0 1-1 1.42V12.5a1.5 1.5 0 0 1-3 0v-.55a1.5 1.5 0 0 1-1-1.42V5a3 3 0 0 1 3-3z"/>
                      </svg>
                    </span>
                    <input
                      type="password"
                      className="form-control border-start-0 ps-0"
                      id="password"
                      name="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
                      disabled={busy}
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <button className="btn btn-primary w-100 py-2 sam-animated-btn" type="submit" disabled={!canSubmit}>
                  {busy ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-box-arrow-in-right me-2 sam-fa-icon" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"/>
                        <path fillRule="evenodd" d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                      </svg>
                      Login
                    </>
                  )}
                </button>
              </form>

              <div className="form-text mt-4 pt-3 border-top">
                <div className="mb-2"><span className="fw-semibold">admin</span> / <span className="fw-semibold">admin123</span></div>
                <div className="small text-muted">Sample teachers: genet, alemu, addisu / teacher123</div>
              </div>
            </div>
            <div className="card-footer bg-light text-center py-2 small text-muted">
              @ 2026 Student Academic Management System
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


