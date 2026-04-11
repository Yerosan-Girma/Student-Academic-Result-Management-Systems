import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './auth/AuthProvider.jsx';
import RequireAuth from './auth/RequireAuth.jsx';
import RequireRole from './auth/RequireRole.jsx';
import AppLayout from './components/AppLayout.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Classes from './pages/Classes.jsx';
import Login from './pages/Login.jsx';
import Marks from './pages/Marks.jsx';
import Reports from './pages/Reports.jsx';
import Students from './pages/Students.jsx';
import Subjects from './pages/Subjects.jsx';
import Teachers from './pages/Teachers.jsx';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route element={<RequireRole roles={['Admin']} />}>
                <Route path="/classes" element={<Classes />} />
                <Route path="/students" element={<Students />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/teachers" element={<Teachers />} />
              </Route>
              <Route element={<RequireRole roles={['Admin', 'Subject Teacher']} />}>
                <Route path="/marks" element={<Marks />} />
              </Route>
              <Route element={<RequireRole roles={['Admin', 'Homeroom Teacher']} />}>
                <Route path="/reports" element={<Reports />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
