import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../api/client.js';
import { useAuth } from '../auth/AuthProvider.jsx';

export function useApi() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return useCallback(
    async (path, opts) => {
      try {
        return await apiFetch(path, opts);
      } catch (err) {
        if (err?.status === 401) {
          await logout();
          navigate('/login', { replace: true });
        }
        throw err;
      }
    },
    [logout, navigate]
  );
}

