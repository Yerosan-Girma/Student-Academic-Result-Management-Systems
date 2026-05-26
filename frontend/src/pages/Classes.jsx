import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Modal from '../components/Modal.jsx';
import { useApi } from '../hooks/useApi.js';

const EMPTY_CLASS = {
  class_id: null,
  class_name: '',
  description: ''
};

export default function Classes() {
  const api = useApi();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageAlert, setPageAlert] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);
  const [form, setForm] = useState(EMPTY_CLASS);
  const modalTitle = form.class_id ? 'Edit Class' : 'Add Class';

  const canSave = useMemo(() => form.class_name.trim().length > 0, [form.class_name]);

  const load = useCallback(async () => {
    setLoading(true);
    setPageAlert(null);
    try {
      const data = await api('/classes');
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setPageAlert({ type: 'danger', message: err?.message || 'Failed to load classes' });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setModalAlert(null);
    setForm(EMPTY_CLASS);
    setModalOpen(true);
  }

  function openEdit(schoolClass) {
    setModalAlert(null);
    setForm({
      class_id: schoolClass.class_id,
      class_name: schoolClass.class_name ?? '',
      description: schoolClass.description ?? ''
    });
    setModalOpen(true);
  }

  async function onDelete(classId) {
    const ok = window.confirm(
      'Delete this class? The system will block deletion if students or teachers are using it.'
    );
    if (!ok) return;

    setPageAlert(null);
    try {
      await api(`/classes/${classId}`, { method: 'DELETE' });
      await load();
      setPageAlert({ type: 'success', message: 'Class deleted.' });
    } catch (err) {
      setPageAlert({ type: 'danger', message: err?.message || 'Delete failed' });
    }
  }

  async function onSave() {
    setModalAlert(null);

    const payload = {
      class_name: form.class_name,
      description: form.description
    };

    try {
      if (form.class_id) {
        await api(`/classes/${form.class_id}`, { method: 'PUT', body: payload });
        setPageAlert({ type: 'success', message: 'Class updated.' });
      } else {
        await api('/classes', { method: 'POST', body: payload });
        setPageAlert({ type: 'success', message: 'Class created.' });
      }

      setModalOpen(false);
      setForm(EMPTY_CLASS);
      await load();
    } catch (err) {
      setModalAlert({ type: 'danger', message: err?.message || 'Save failed' });
    }
  }

  return (
    <main className="container py-4 page-enter">
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <div>
          <h1 className="h4 mb-1 shimmer-text">Class Management</h1>
          <div className="text-muted small">Manage classes as a dedicated entity without changing reports and marks behavior</div>
        </div>
        <button className="btn btn-primary sam-animated-btn d-flex align-items-center gap-2" type="button" onClick={openCreate}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Class
        </button>
      </div>

      <Alert alert={pageAlert} onClose={() => setPageAlert(null)} />

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th style={{ width: 150 }}>Class</th>
                <th>Description</th>
                <th style={{ width: 130 }}>Students</th>
                <th style={{ width: 140 }}>Teachers</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-building mb-2 opacity-50" viewBox="0 0 16 16">
                      <path d="M14.5 2h-13l-.5.5v12l.5.5h13l.5-.5v-12l-.5-.5zm-1 1v11H2V3h11.5zM4 4v2H3V4h1zm0 3v2H3V7h1zm0 3v2H3V9h1z"/>
                    </svg>
                    <div>No classes found.</div>
                  </td>
                </tr>
              ) : (
                classes.map((schoolClass) => (
                  <tr key={schoolClass.class_id}>
                    <td className="fw-medium">{schoolClass.class_id}</td>
                    <td className="fw-semibold">{schoolClass.class_name}</td>
                    <td>{schoolClass.description ?? ''}</td>
                    <td>{schoolClass.student_count ?? 0}</td>
                    <td>{schoolClass.teacher_count ?? 0}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary sam-animated-btn"
                          type="button"
                          onClick={() => openEdit(schoolClass)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger sam-animated-btn"
                          type="button"
                          onClick={() => onDelete(schoolClass.class_id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={modalTitle}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary sam-animated-btn"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-primary sam-animated-btn" onClick={onSave} disabled={!canSave}>
              Save
            </button>
          </>
        }
      >
        <Alert alert={modalAlert} onClose={() => setModalAlert(null)} />

        <div className="mb-3">
          <label className="form-label" htmlFor="className">
            Class Name
          </label>
          <input
            className="form-control"
            id="className"
            required
            placeholder="e.g., 9A"
            value={form.class_name}
            onChange={(e) => setForm((v) => ({ ...v, class_name: e.target.value }))}
          />
        </div>

        <div className="mb-0">
          <label className="form-label" htmlFor="classDescription">
            Description (Optional)
          </label>
          <textarea
            className="form-control"
            id="classDescription"
            rows="3"
            placeholder="e.g., Grade 9 Section A"
            value={form.description}
            onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
          />
        </div>
      </Modal>
    </main>
  );
}
