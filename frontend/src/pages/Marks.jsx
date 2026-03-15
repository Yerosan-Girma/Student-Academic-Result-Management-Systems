import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import { useApi } from '../hooks/useApi.js';

function computeStatus(value) {
  if (value === '') return { text: '-', cls: 'text-muted fw-semibold' };
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 100) {
    return { text: 'Invalid', cls: 'text-warning fw-semibold' };
  }
  if (num >= 50) return { text: 'PASS', cls: 'text-success fw-semibold' };
  return { text: 'FAIL', cls: 'text-danger fw-semibold' };
}

export default function Marks() {
  const api = useApi();

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [currentStudentId, setCurrentStudentId] = useState('');
  const [marksBySubject, setMarksBySubject] = useState({});

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState(null);

  const canInteract = useMemo(() => currentStudentId !== '' && !busy, [currentStudentId, busy]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const [st, sb] = await Promise.all([api('/students'), api('/subjects')]);
      setStudents(Array.isArray(st) ? st : []);
      setSubjects(Array.isArray(sb) ? sb : []);
    } catch (err) {
      setAlert({ type: 'danger', message: err?.message || 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadMarks = useCallback(
    async (studentId) => {
      setAlert(null);
      const data = await api(`/marks?student_id=${encodeURIComponent(studentId)}`);
      const map = {};
      for (const item of Array.isArray(data) ? data : []) {
        map[item.subject_id] = String(item.mark);
      }
      setMarksBySubject(map);
    },
    [api]
  );

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (currentStudentId === '') {
      setMarksBySubject({});
      return;
    }

    loadMarks(currentStudentId).catch((err) => {
      setAlert({ type: 'danger', message: err?.message || 'Failed to load marks' });
    });
  }, [currentStudentId, loadMarks]);

  const onSave = useCallback(async () => {
    setAlert(null);
    if (!currentStudentId) return;
    if (subjects.length === 0) return;

    const payloadMarks = [];
    for (const sub of subjects) {
      const raw = marksBySubject[sub.subject_id] ?? '';
      if (raw === '') {
        setAlert({ type: 'warning', message: 'Enter marks for all subjects before saving.' });
        return;
      }
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        setAlert({ type: 'warning', message: 'Marks must be between 0 and 100.' });
        return;
      }
      payloadMarks.push({ subject_id: sub.subject_id, mark: Math.trunc(value) });
    }

    setBusy(true);
    try {
      await api('/marks/bulk', {
        method: 'POST',
        body: { student_id: Number(currentStudentId), marks: payloadMarks }
      });
      await loadMarks(currentStudentId);
      setAlert({ type: 'success', message: 'Marks saved.' });
    } catch (err) {
      setAlert({ type: 'danger', message: err?.message || 'Save failed' });
    } finally {
      setBusy(false);
    }
  }, [api, currentStudentId, loadMarks, marksBySubject, subjects]);

  const onReload = useCallback(async () => {
    if (!currentStudentId) return;
    setBusy(true);
    setAlert(null);
    try {
      await loadMarks(currentStudentId);
      setAlert({ type: 'success', message: 'Marks reloaded.' });
    } catch (err) {
      setAlert({ type: 'danger', message: err?.message || 'Failed to reload marks' });
    } finally {
      setBusy(false);
    }
  }, [currentStudentId, loadMarks]);

  return (
    <main className="container py-4">
      <div className="mb-3">
        <h1 className="h4 mb-1">Mark Management</h1>
        <div className="text-muted small">Enter marks per student per subject (0 - 100, PASS = 50)</div>
      </div>

      <div className="row g-3 align-items-end mb-3">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="markStudentSelect">
            Select Student
          </label>
          <select
            className="form-select"
            id="markStudentSelect"
            value={currentStudentId}
            onChange={(e) => setCurrentStudentId(e.target.value)}
            disabled={loading || busy}
          >
            <option value="">Select...</option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.student_name} (ID: {s.student_code ?? s.student_id})
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-lg-6 d-flex gap-2">
          <button className="btn btn-primary" type="button" onClick={onSave} disabled={!canInteract}>
            Save Marks
          </button>
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={onReload}
            disabled={!canInteract}
          >
            Reload
          </button>
        </div>
      </div>

      <Alert alert={alert} onClose={() => setAlert(null)} />

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-striped mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>Subject</th>
                <th style={{ width: 160 }}>Mark</th>
                <th style={{ width: 140 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!currentStudentId ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    Select a student to enter marks.
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    No subjects available. Add subjects first.
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => {
                  const value = marksBySubject[sub.subject_id] ?? '';
                  const status = computeStatus(value);
                  return (
                    <tr key={sub.subject_id}>
                      <td>{sub.subject_id}</td>
                      <td>{sub.subject_name}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm mark-input"
                          min="0"
                          max="100"
                          step="1"
                          value={value}
                          placeholder="0-100"
                          required
                          disabled={!canInteract}
                          onChange={(e) =>
                            setMarksBySubject((v) => ({ ...v, [sub.subject_id]: e.target.value }))
                          }
                        />
                      </td>
                      <td className={status.cls}>{status.text}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
