import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Modal from '../components/Modal.jsx';
import { useApi } from '../hooks/useApi.js';

const EMPTY_TEACHER = {
  teacher_id: null,
  teacher_name: '',
  department_id: '',
  assigned_class: '',
  role: 'Subject Teacher'
};

export default function Teachers() {
  const api = useApi();

  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageAlert, setPageAlert] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);
  const [form, setForm] = useState(EMPTY_TEACHER);
  const modalTitle = form.teacher_id ? 'Edit Teacher' : 'Add Teacher';

  const canSave = useMemo(() => {
    if (form.teacher_name.trim().length === 0) return false;
    if (!['Homeroom Teacher', 'Subject Teacher'].includes(form.role)) return false;
    if (form.role === 'Homeroom Teacher' && form.assigned_class.trim().length === 0) return false;
    return true;
  }, [form]);

  const load = useCallback(async () => {
    setLoading(true);
    setPageAlert(null);
    try {
      const [depts, teach] = await Promise.all([api('/departments'), api('/teachers')]);
      setDepartments(Array.isArray(depts) ? depts : []);
      setTeachers(Array.isArray(teach) ? teach : []);
    } catch (err) {
      setPageAlert({ type: 'danger', message: err?.message || 'Failed to load teachers' });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setModalAlert(null);
    setForm(EMPTY_TEACHER);
    setModalOpen(true);
  }

  function openEdit(teacher) {
    setModalAlert(null);
    setForm({
      teacher_id: teacher.teacher_id,
      teacher_name: teacher.teacher_name ?? '',
      department_id: teacher.department_id ?? '',
      assigned_class: teacher.assigned_class ?? '',
      role: teacher.role ?? 'Subject Teacher'
    });
    setModalOpen(true);
  }

  async function onDelete(teacherId) {
    const ok = window.confirm('Delete this teacher? Subjects will be unassigned.');
    if (!ok) return;

    setPageAlert(null);
    try {
      await api(`/teachers/${teacherId}`, { method: 'DELETE' });
      await load();
      setPageAlert({ type: 'success', message: 'Teacher deleted.' });
    } catch (err) {
      setPageAlert({ type: 'danger', message: err?.message || 'Delete failed' });
    }
  }

  async function onSave() {
    setModalAlert(null);
    if (!canSave) {
      setModalAlert({ type: 'warning', message: 'Fill out required fields before saving.' });
      return;
    }

    const payload = {
      teacher_name: form.teacher_name,
      department_id: form.department_id || null,
      role: form.role,
      assigned_class: form.assigned_class
    };

    try {
      if (form.teacher_id) {
        await api(`/teachers/${form.teacher_id}`, { method: 'PUT', body: payload });
        setPageAlert({ type: 'success', message: 'Teacher updated.' });
      } else {
        await api('/teachers', { method: 'POST', body: payload });
        setPageAlert({ type: 'success', message: 'Teacher created.' });
      }
      setModalOpen(false);
      setForm(EMPTY_TEACHER);
      await load();
    } catch (err) {
      setModalAlert({ type: 'danger', message: err?.message || 'Save failed' });
    }
  }

  return (
    <main className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-1">Teacher Management</h1>
          <div className="text-muted small">
            Register teachers and assign department / class / role
          </div>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          Add Teacher
        </button>
      </div>

      <Alert alert={pageAlert} onClose={() => setPageAlert(null)} />

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-striped mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 180 }}>Department</th>
                <th style={{ width: 160 }}>Assigned Class</th>
                <th style={{ width: 180 }}>Role</th>
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
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No teachers found.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.teacher_id}>
                    <td>{t.teacher_id}</td>
                    <td>{t.teacher_name}</td>
                    <td>{t.department_name ?? ''}</td>
                    <td>{t.assigned_class ?? ''}</td>
                    <td>{t.role}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          type="button"
                          onClick={() => openEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          type="button"
                          onClick={() => onDelete(t.teacher_id)}
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
          <label className="form-label" htmlFor="teacherName">
            Teacher Name
          </label>
          <input
            className="form-control"
            id="teacherName"
            required
            value={form.teacher_name}
            onChange={(e) => setForm((v) => ({ ...v, teacher_name: e.target.value }))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="teacherDepartment">
            Department
          </label>
          <select
            className="form-select"
            id="teacherDepartment"
            value={form.department_id}
            onChange={(e) => setForm((v) => ({ ...v, department_id: e.target.value }))}
          >
            <option value="">(None)</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.department_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="teacherRole">
            Role
          </label>
          <select
            className="form-select"
            id="teacherRole"
            required
            value={form.role}
            onChange={(e) => setForm((v) => ({ ...v, role: e.target.value }))}
          >
            <option value="Subject Teacher">Subject Teacher</option>
            <option value="Homeroom Teacher">Homeroom Teacher</option>
          </select>
          <div className="form-text">
            Homeroom Teacher requires an Assigned Class and must be unique per class.
          </div>
        </div>

        <div className="mb-0">
          <label className="form-label" htmlFor="assignedClass">
            Assigned Class
          </label>
          <input
            className="form-control"
            id="assignedClass"
            placeholder="e.g., Grade 10-A"
            value={form.assigned_class}
            onChange={(e) => setForm((v) => ({ ...v, assigned_class: e.target.value }))}
          />
        </div>
      </Modal>
    </main>
  );
}

