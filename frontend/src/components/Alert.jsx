import React from 'react';

export default function Alert({ alert, onClose }) {
  if (!alert) return null;

  return (
    <div className={`alert alert-${alert.type || 'danger'}`} role="alert">
      <div className="d-flex gap-2 align-items-start justify-content-between">
        <div>{alert.message}</div>
        {onClose ? (
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        ) : null}
      </div>
    </div>
  );
}

