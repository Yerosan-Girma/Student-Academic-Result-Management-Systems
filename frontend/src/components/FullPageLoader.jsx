import React from 'react';

export default function FullPageLoader({ label = 'Loading...' }) {
  return (
    <main className="container py-5">
      <div className="text-center">
        <div className="spinner-border" role="status" aria-hidden="true"></div>
        <div className="mt-3 text-muted">{label}</div>
      </div>
    </main>
  );
}

