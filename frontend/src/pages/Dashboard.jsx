import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider.jsx';

export default function Dashboard() {
  const { admin } = useAuth();

  return (
    <main className="container py-4 dashboard-shell">
      <div className="d-flex align-items-center justify-content-between mb-3 dashboard-head">
        <div>
          <h1 className="h4 mb-1">Dashboard</h1>
          <div className="text-muted small">
            Manage students, subjects, teachers, marks and reports
          </div>
        </div>
        <div className="text-muted small" id="adminLabel">
          {admin?.username ? `Logged in as: ${admin.username}` : ''}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6 col-lg-4">
          <Link className="card-link" to="/students">
            <div className="card shadow-sm h-100 feature-tile">
              <div className="card-body">
                <div className="h5 mb-1">Students</div>
                <div className="text-muted">Register, update and delete student records</div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <Link className="card-link" to="/subjects">
            <div className="card shadow-sm h-100 feature-tile">
              <div className="card-body">
                <div className="h5 mb-1">Subjects</div>
                <div className="text-muted">Manage subjects and departments</div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <Link className="card-link" to="/teachers">
            <div className="card shadow-sm h-100 feature-tile">
              <div className="card-body">
                <div className="h5 mb-1">Teachers</div>
                <div className="text-muted">Register teachers and assign roles/classes</div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <Link className="card-link" to="/marks">
            <div className="card shadow-sm h-100 feature-tile">
              <div className="card-body">
                <div className="h5 mb-1">Marks</div>
                <div className="text-muted">Enter and update marks per student per subject</div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-4">
          <Link className="card-link" to="/reports">
            <div className="card shadow-sm h-100 feature-tile">
              <div className="card-body">
                <div className="h5 mb-1">Reports</div>
                <div className="text-muted">Generate totals, averages, rank and PASS/FAIL</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}

