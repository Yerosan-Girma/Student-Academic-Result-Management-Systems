import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider.jsx';

const ICONS = {
  classes: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0a1 1 0 0 1 1 1v5.256A4.5 4.5 0 0 1 12.5 8h5.75a1 1 0 0 1 .5 1.866l-5 3.5a1 1 0 0 1-1.5-.5V9.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v3.5a1 1 0 0 1-1.5.5l-5-3.5a1 1 0 0 1-.5-1.866h5.75A4.5 4.5 0 0 1 7 6.256V1a1 1 0 0 1 1-1z"/>
    </svg>
  ),
  students: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 1 .5V4a4 4 0 0 1-8 0v2.55a2.5 2.5 0 0 1 1-.5V4a4 4 0 0 1 4-4z"/>
      <path d="M11.5 9.25a3.5 3.5 0 0 0-7 0v3.75a3.5 3.5 0 0 0 7 0v-3.75z"/>
    </svg>
  ),
  subjects: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
      <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 1.5 15h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z"/>
      <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
    </svg>
  ),
  teachers: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
      <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.002c-.001-.246-.154-.986-.832-1.664C9.516 10.68 9.235 11 9 11c-.235 0-.516-.32-.832-.336C7.168 10.014 7.001 9.774 7 9.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5z"/>
    </svg>
  ),
  marks: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
      <path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2 2a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm2 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z"/>
    </svg>
  ),
  reports: (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1 0-1h3.5V1.5A.5.5 0 0 1 8 1zm7.5 9.5a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-2.5a.5.5 0 0 1 .5-.5h9zm0-1h-9a1.5 1.5 0 0 0-1.5 1.5v2.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-2.5a1.5 1.5 0 0 0-1.5-1.5z"/>
      <path d="M14.5 8a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h13z"/>
    </svg>
  ),
};

function FeatureTile({ to, icon, title, description }) {
  return (
    <div className="col-12 col-md-6 col-lg-4">
      <Link className="card-link" to={to}>
        <div className="card shadow-sm h-100 feature-tile sam-hover-card border-0">
          <div className="card-body text-center p-4">
            <div className="feature-key mb-3 mx-auto">{icon}</div>
            <h5 className="mb-2">{title}</h5>
            <p className="text-muted small mb-0">{description}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.teacher_name ?? user?.username ?? '';
  const role = user?.role ?? 'Admin';

  if (role === 'Subject Teacher') {
    return (
      <main className="container py-4 dashboard-shell">
        <div className="dashboard-hero mb-4">
          <div>
            <div className="dashboard-kicker">TEACHER DASHBOARD</div>
            <h1 className="dashboard-title mb-1">Welcome{displayName ? `, ${displayName}` : ''}</h1>
            <p className="dashboard-subtitle mb-0">Enter marks for your assigned subjects</p>
          </div>
          <span className="dashboard-admin">{role}</span>
        </div>

        <div className="row g-3">
          <FeatureTile
            to="/marks"
            icon={ICONS.marks}
            title="Enter Marks"
            description="Select class, semester, and record student marks"
          />
        </div>
      </main>
    );
  }

  if (role === 'Homeroom Teacher') {
    return (
      <main className="container py-4 dashboard-shell">
        <div className="dashboard-hero mb-4">
          <div>
            <div className="dashboard-kicker">HOMEROOM DASHBOARD</div>
            <h1 className="dashboard-title mb-1">Welcome{displayName ? `, ${displayName}` : ''}</h1>
            <p className="dashboard-subtitle mb-0">
              Compile results and generate student reports
              {user?.assigned_class ? ` | Class: ${user.assigned_class}` : ''}
            </p>
          </div>
          <span className="dashboard-admin">{role}</span>
        </div>

        <div className="row g-3">
          <FeatureTile
            to="/reports?view=marks"
            icon={ICONS.marks}
            title="View Student Marks"
            description="See subject marks for each student"
          />
          <FeatureTile
            to="/reports?view=class"
            icon={ICONS.reports}
            title="Generate Class Report"
            description="View totals, averages, and rankings"
          />
          <FeatureTile
            to="/reports?view=student"
            icon={ICONS.students}
            title="Generate Individual Report"
            description="Open a student result sheet"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="container py-4 dashboard-shell">
      <div className="dashboard-hero mb-4">
        <div>
          <div className="dashboard-kicker">ADMIN DASHBOARD</div>
          <h1 className="dashboard-title mb-1">Welcome{displayName ? `, ${displayName}` : ''}</h1>
          <p className="dashboard-subtitle mb-0">Manage classes, students, subjects, teachers, and reports</p>
        </div>
        <span className="dashboard-admin">{role}</span>
      </div>

      <div className="row g-3">
        <FeatureTile
          to="/classes"
          icon={ICONS.classes}
          title="Classes"
          description="Manage the shared class master list"
        />
        <FeatureTile
          to="/students"
          icon={ICONS.students}
          title="Students"
          description="Register, update and delete student records"
        />
        <FeatureTile
          to="/subjects"
          icon={ICONS.subjects}
          title="Subjects"
          description="Manage subjects and departments"
        />
        <FeatureTile
          to="/teachers"
          icon={ICONS.teachers}
          title="Teachers"
          description="Register teachers and assign roles/classes"
        />
        <FeatureTile
          to="/reports?view=marks"
          icon={ICONS.marks}
          title="View Student Marks"
          description="Review subject marks by class"
        />
        <FeatureTile
          to="/reports?view=class"
          icon={ICONS.reports}
          title="Generate Class Report"
          description="Totals, averages, ranks and PASS/FAIL"
        />
        <FeatureTile
          to="/reports?view=student"
          icon={ICONS.students}
          title="Generate Individual Report"
          description="Open a student result sheet"
        />
      </div>
    </main>
  );
}
