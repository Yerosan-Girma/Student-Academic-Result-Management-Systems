import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { apiFetch } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await apiFetch('/auth/me');
        if (!cancelled) setUser(me);
      } catch (err) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      async login({ username, password }) {
        const me = await apiFetch('/auth/login', {
          method: 'POST',
          body: { username, password }
        });
        setUser(me);
        return me;
      },
      async logout() {
        try {
          await apiFetch('/auth/logout', { method: 'POST' });
        } catch (err) {
          // Best-effort logout.
        } finally {
          setUser(null);
        }
      },
      async refresh() {
        const me = await apiFetch('/auth/me');
        setUser(me);
        return me;
      }
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
