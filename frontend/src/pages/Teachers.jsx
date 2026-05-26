import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Modal from '../components/Modal.jsx';
import { useApi } from '../hooks/useApi.js';

const EMPTY_TEACHER = {
  teacher_id: null,
  teacher_name: '',
  username: '',
  password: '',
  department_id: '',
  assigned_class: '',
  role: 'Subject Teacher'
};

export default function Teachers() {
  const api = useApi();

  const [classes, setClasses] = useState([]);
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
    if (form.username.trim().length === 0) return false;
    if (!['Homeroom Teacher', 'Subject Teacher'].includes(form.role)) return false;
    if (!form.department_id) return false;
    if (form.role === 'Homeroom Teacher' && form.assigned_class.trim().length === 0) return false;
    if (!form.teacher_id && form.password.trim().length === 0) return false;
    return true;
  }, [form]);

  const load = useCallback(async () => {
    setLoading(true);
    setPageAlert(null);
    try {
      const [classData, depts, teach] = await Promise.all([
        api('/classes'),
        api('/departments'),
        api('/teachers')
      ]);
      setClasses(Array.isArray(classData) ? classData : []);
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
      username: teacher.username ?? '',
      password: '',
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
      username: form.username,
      department_id: form.department_id || null,
      role: form.role,
      assigned_class: form.assigned_class
    };

    if (form.password.trim().length > 0) {
      payload.password = form.password;
    }

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
    <main className="container py-4 page-enter">
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <div>
          <h1 className="h4 mb-1 shimmer-text">Teacher Management</h1>
          <div className="text-muted small">Register teachers and assign department, class, and role</div>
        </div>
        <button className="btn btn-primary sam-animated-btn d-flex align-items-center gap-2" type="button" onClick={openCreate}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Teacher
        </button>
      </div>

      <Alert alert={pageAlert} onClose={() => setPageAlert(null)} />

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 180 }}>Username</th>
                <th style={{ width: 180 }}>Department</th>
                <th style={{ width: 160 }}>Assigned Class</th>
                <th style={{ width: 180 }}>Role</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-person-gear mb-2 opacity-50" viewBox="0 0 16 16">
                      <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                      <path d="M8.207 12.293a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 0 1-1.414 0L3.5 14.207a1 1 0 0 1 0-1.414l1.414-1.414a1 1 0 0 1 1.414 0l.793.793.793-.793zM14 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"/>
                    </svg>
                    <div>No teachers found.</div>
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.teacher_id}>
                    <td className="fw-medium">{t.teacher_id}</td>
                    <td>{t.teacher_name}</td>
                    <td>{t.username ?? ''}</td>
                    <td>{t.department_name ?? ''}</td>
                    <td>{t.assigned_class ?? ''}</td>
                    <td>{t.role}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary sam-animated-btn"
                          type="button"
                          onClick={() => openEdit(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger sam-animated-btn"
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
          <label className="form-label" htmlFor="teacherUsername">
            Username
          </label>
          <input
            className="form-control"
            id="teacherUsername"
            required
            value={form.username}
            onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="teacherPassword">
            Password {form.teacher_id ? '(optional)' : ''}
          </label>
          <input
            type="password"
            className="form-control"
            id="teacherPassword"
            placeholder={form.teacher_id ? 'Leave blank to keep current password' : 'Set a password'}
            value={form.password}
            onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="teacherDepartment">
            Department
          </label>
          <select
            className="form-select"
            id="teacherDepartment"
            required
            value={form.department_id}
            onChange={(e) => setForm((v) => ({ ...v, department_id: e.target.value }))}
          >
            <option value="">Select department</option>
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
            list="teacherClassOptions"
            placeholder="e.g., 9A"
            value={form.assigned_class}
            onChange={(e) => setForm((v) => ({ ...v, assigned_class: e.target.value }))}
          />
          <datalist id="teacherClassOptions">
            {classes.map((schoolClass) => (
              <option key={schoolClass.class_id} value={schoolClass.class_name} />
            ))}
          </datalist>
          <div className="form-text">Choose an existing class or type a new one.</div>
        </div>
      </Modal>
    </main>
  );
}
