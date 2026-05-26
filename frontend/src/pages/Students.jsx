import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import Modal from '../components/Modal.jsx';
import { useApi } from '../hooks/useApi.js';

const EMPTY_FORM = {
  student_id: null,
  student_name: '',
  gender: '',
  grade: '',
  academic_year: '',
  semester: ''
};

export default function Students() {
  const api = useApi();

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageAlert, setPageAlert] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalAlert, setModalAlert] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const modalTitle = form.student_id ? 'Edit Student' : 'Add Student';

  const canSave = useMemo(() => {
    return (
      form.student_name.trim().length > 0 &&
      ['Male', 'Female', 'Other'].includes(form.gender) &&
      form.grade.trim().length > 0 &&
      form.academic_year.trim().length > 0 &&
      form.semester.trim().length > 0
    );
  }, [form]);

  const load = useCallback(async () => {
    setLoading(true);
    setPageAlert(null);
    try {
      const [studentData, classData] = await Promise.all([api('/students'), api('/classes')]);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setClasses(Array.isArray(classData) ? classData : []);
    } catch (err) {
      setPageAlert({ type: 'danger', message: err?.message || 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setModalAlert(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(student) {
    setModalAlert(null);
    setForm({
      student_id: student.student_id,
      student_name: student.student_name ?? '',
      gender: student.gender ?? '',
      grade: student.grade ?? '',
      academic_year: student.academic_year ?? '',
      semester: student.semester ?? ''
    });
    setModalOpen(true);
  }

  async function onDelete(studentId) {
    const ok = window.confirm('Delete this student? Marks will also be deleted.');
    if (!ok) return;

    setPageAlert(null);
    try {
      await api(`/students/${studentId}`, { method: 'DELETE' });
      await load();
      setPageAlert({ type: 'success', message: 'Student deleted.' });
    } catch (err) {
      setPageAlert({ type: 'danger', message: err?.message || 'Delete failed' });
    }
  }

  async function onSave() {
    setModalAlert(null);

    const payload = {
      student_name: form.student_name,
      gender: form.gender,
      grade: form.grade,
      academic_year: form.academic_year,
      semester: form.semester
    };

    try {
      if (form.student_id) {
        await api(`/students/${form.student_id}`, { method: 'PUT', body: payload });
        setPageAlert({ type: 'success', message: 'Student updated.' });
      } else {
        await api('/students', { method: 'POST', body: payload });
        setPageAlert({ type: 'success', message: 'Student created.' });
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setModalAlert({ type: 'danger', message: err?.message || 'Save failed' });
    }
  }

  return (
    <main className="container py-4 page-enter">
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-2">
        <div>
          <h1 className="h4 mb-1 shimmer-text">Student Management</h1>
          <div className="text-muted small">Register and manage student records by class</div>
        </div>
        <button className="btn btn-primary sam-animated-btn d-flex align-items-center gap-2" type="button" onClick={openCreate}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add Student
        </button>
      </div>

      <Alert alert={pageAlert} onClose={() => setPageAlert(null)} />

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 140 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 120 }}>Gender</th>
                <th style={{ width: 120 }}>Class</th>
                <th style={{ width: 140 }}>Academic Year</th>
                <th style={{ width: 120 }}>Semester</th>
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
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-people mb-2 opacity-50" viewBox="0 0 16 16">
                      <path d="M13 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm4 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                      <path d="M5.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm.5 1.5a4.5 4.5 0 0 1-4.5-4.5V6a4.5 4.5 0 0 1 9 0v.5a4.5 4.5 0 0 1-4.5 4.5H6z"/>
                    </svg>
                    <div>No students found.</div>
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.student_id}>
                    <td className="fw-medium">{s.student_id}</td>
                    <td>{s.student_name}</td>
                    <td>{s.gender}</td>
                    <td>{s.grade}</td>
                    <td>{s.academic_year}</td>
                    <td>{s.semester}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary sam-animated-btn"
                          type="button"
                          onClick={() => openEdit(s)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger sam-animated-btn"
                          type="button"
                          onClick={() => onDelete(s.student_id)}
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
          <label className="form-label" htmlFor="studentName">
            Student Name
          </label>
          <input
            className="form-control"
            id="studentName"
            required
            value={form.student_name}
            onChange={(e) => setForm((v) => ({ ...v, student_name: e.target.value }))}
          />
        </div>

        <div className="mb-3">
          <div className="form-text">
            Student ID is generated automatically by the system.
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="studentGender">
            Gender
          </label>
          <select
            className="form-select"
            id="studentGender"
            required
            value={form.gender}
            onChange={(e) => setForm((v) => ({ ...v, gender: e.target.value }))}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="studentGrade">
            Class
          </label>
          <input
            className="form-control"
            id="studentGrade"
            list="studentClassOptions"
            required
            placeholder="e.g., 9A"
            value={form.grade}
            onChange={(e) => setForm((v) => ({ ...v, grade: e.target.value }))}
          />
          <datalist id="studentClassOptions">
            {classes.map((schoolClass) => (
              <option key={schoolClass.class_id} value={schoolClass.class_name} />
            ))}
          </datalist>
          <div className="form-text">Choose an existing class or type a new one.</div>
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="academicYear">
            Academic Year
          </label>
          <input
            className="form-control"
            id="academicYear"
            required
            placeholder="e.g., 2025/2026"
            value={form.academic_year}
            onChange={(e) => setForm((v) => ({ ...v, academic_year: e.target.value }))}
          />
        </div>

        <div className="mb-0">
          <label className="form-label" htmlFor="semester">
            Semester
          </label>
          <input
            className="form-control"
            id="semester"
            required
            placeholder="e.g., 1"
            value={form.semester}
            onChange={(e) => setForm((v) => ({ ...v, semester: e.target.value }))}
          />
        </div>
      </Modal>
    </main>
  );
}
