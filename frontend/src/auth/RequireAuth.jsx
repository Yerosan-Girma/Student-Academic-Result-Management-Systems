import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './AuthProvider.jsx';
import FullPageLoader from '../components/FullPageLoader.jsx';

export default function RequireAuth() {
  const { admin, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader label="Checking session..." />;
  if (!admin) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}

