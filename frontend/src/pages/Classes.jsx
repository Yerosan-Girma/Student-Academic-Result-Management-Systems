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
    <main className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-1">Class Management</h1>
          <div className="text-muted small">
            Manage classes as a dedicated entity without changing reports and marks behavior
          </div>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          Add Class
        </button>
      </div>

      <Alert alert={pageAlert} onClose={() => setPageAlert(null)} />

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-striped mb-0">
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
                  <td colSpan={6} className="text-center text-muted py-4">
                    Loading...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No classes found.
                  </td>
                </tr>
              ) : (
                classes.map((schoolClass) => (
                  <tr key={schoolClass.class_id}>
                    <td>{schoolClass.class_id}</td>
                    <td className="fw-semibold">{schoolClass.class_name}</td>
                    <td>{schoolClass.description ?? ''}</td>
                    <td>{schoolClass.student_count ?? 0}</td>
                    <td>{schoolClass.teacher_count ?? 0}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={() => openEdit(schoolClass)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
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
              className="btn btn-outline-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={onSave} disabled={!canSave}>
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
