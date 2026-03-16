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
          <div className="card shadow-sm login-card">
            <div className="card-body p-4">
              <h1 className="h4 mb-3">User Login</h1>
              <p className="text-muted mb-4">Student Academic Record Management System</p>

              <Alert alert={alert} onClose={() => setAlert(null)} />

              <form onSubmit={onSubmit} autoComplete="off">
                <div className="mb-3">
                  <label className="form-label" htmlFor="username">
                    Username
                  </label>
                  <input
                    className="form-control"
                    id="username"
                    name="username"
                    required
                    value={form.username}
                    onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))}
                    disabled={busy}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
                    disabled={busy}
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={!canSubmit}>
                  {busy ? 'Signing in...' : 'Login'}
                </button>
              </form>

              <div className="form-text mt-3">
                Default admin: <span className="fw-semibold">admin</span> /{' '}
                <span className="fw-semibold">admin123</span>
              </div>
              <div className="form-text">
                Sample teachers (if seeded): <span className="fw-semibold">genet</span>,{' '}
                <span className="fw-semibold">alemu</span>, <span className="fw-semibold">addisu</span>{' '}
                / <span className="fw-semibold">teacher123</span>
              </div>
            </div>
          </div>
          <div className="text-center text-muted mt-3 small">@ 2026</div>
        </div>
      </div>
    </main>
  );
}
