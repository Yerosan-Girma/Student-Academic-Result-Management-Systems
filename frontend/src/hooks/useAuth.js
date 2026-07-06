// useAuth Hook - custom hook for authentication
import { useState, useEffect } from 'react';
import { auth } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await auth.getCurrentUser();
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await auth.login(username, password);
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setUser(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Logout failed');
    }
  };

  return { user, loading, error, login, logout, checkAuth };
}