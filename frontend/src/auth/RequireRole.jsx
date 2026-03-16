import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './AuthProvider.jsx';
import FullPageLoader from '../components/FullPageLoader.jsx';

export default function RequireRole({ roles = [] }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader label="Checking access..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
