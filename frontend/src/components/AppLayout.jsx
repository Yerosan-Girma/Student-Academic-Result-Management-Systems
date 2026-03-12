import React from 'react';
import { Outlet } from 'react-router-dom';

import SamNavbar from './SamNavbar.jsx';

export default function AppLayout() {
  return (
    <>
      <SamNavbar />
      <Outlet />
    </>
  );
}

