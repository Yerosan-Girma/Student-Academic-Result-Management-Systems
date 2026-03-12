import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Alert from '../components/Alert.jsx';
import { useApi } from '../hooks/useApi.js';

export default function Reports() {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [reports, setReports] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const selectedReport = useMemo(() => {
    const id = selectedStudentId ? Number(selectedStudentId) : null;
    if (!id) return null;
    return reports.find((r) => r.student?.student_id === id) ?? null;
  }, [reports, selectedStudentId]);

  const load = useCallback(async () => {
    setLoading(true);
    setAlert(null);
    try {
      const data = await api('/reports');
      const nextReports = Array.isArray(data?.reports) ? data.reports : [];
      setReports(nextReports);

      setSelectedStudentId((prev) => {
        if (!prev) return '';
        if (nextReports.length === 0) return '';
        const exists = nextReports.some((r) => r.student?.student_id === Number(prev));
        return exists ? prev : '';
      });
      return true;
    } catch (err) {
      setAlert({ type: 'danger', message: err?.message || 'Failed to load reports' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    const ok = await load();
    if (ok) setAlert({ type: 'success', message: 'Reports refreshed.' });
  }, [load]);

  function onPrint() {
    window.print();
  }

  return (
    <main className="container py-4 report-shell">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h1 className="h4 mb-1">Report Generation</h1>
          <div className="text-muted small">Totals, averages, ranks and PASS/FAIL</div>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          type="button"
          onClick={onPrint}
          disabled={!selectedReport}
        >
          Print
        </button>
      </div>

      <Alert alert={alert} onClose={() => setAlert(null)} />

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm roster-card">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2 roster-headline">
                <h2 className="h6 mb-0">Class Ranking</h2>
                <button
                  className="btn btn-outline-primary btn-sm"
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-sm table-striped mb-0 roster-table">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 70 }}>Rank</th>
                      <th style={{ width: 80 }}>ID</th>
                      <th>Name</th>
                      <th style={{ width: 90 }}>Total</th>
                      <th style={{ width: 100 }}>Average</th>
                      <th style={{ width: 90 }}>Status</th>
                      <th style={{ width: 80 }}>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-3">
                          Loading...
                        </td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-3">
                          No students found.
                        </td>
                      </tr>
                    ) : (
                      reports.map((r) => (
                        <tr key={r.student.student_id}>
                          <td className="fw-semibold">{r.rank}</td>
                          <td>{r.student.student_id}</td>
                          <td>{r.student.student_name}</td>
                          <td>{r.total}</td>
                          <td>{r.average}</td>
                          <td
                            className={`${r.status === 'PASS' ? 'text-success' : 'text-danger'} fw-semibold`}
                          >
                            {r.status}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              type="button"
                              onClick={() => setSelectedStudentId(String(r.student.student_id))}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card shadow-sm result-card">
            <div className="card-body">
              <h2 className="h6 mb-3">Student Result Sheet</h2>

              <div className="mb-3">
                <label className="form-label" htmlFor="reportStudentSelect">
                  Select Student
                </label>
                <select
                  className="form-select"
                  id="reportStudentSelect"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={loading || reports.length === 0}
                >
                  <option value="">Select...</option>
                  {reports.map((r) => (
                    <option key={r.student.student_id} value={r.student.student_id}>
                      {r.student.student_name} (ID: {r.student.student_id})
                    </option>
                  ))}
                </select>
              </div>

              {selectedReport ? (
                <div id="sheetArea">
                  <div className="small text-muted mb-2" id="sheetHeader">
                    Student: {selectedReport.student.student_name} | ID: {selectedReport.student.student_id}{' '}
                    | Grade: {selectedReport.student.grade} | Year: {selectedReport.student.academic_year}{' '}
                    | Semester: {selectedReport.student.semester}
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm mb-2">
                      <thead className="table-light">
                        <tr>
                          <th>Subject</th>
                          <th style={{ width: 90 }}>Mark</th>
                          <th style={{ width: 90 }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.subjectMarks.map((m) => {
                          const mark = m.mark ?? null;
                          const markText = mark === null ? '-' : String(mark);
                          const result = mark === null ? '-' : mark >= 50 ? 'PASS' : 'FAIL';
                          const cls =
                            result === 'PASS'
                              ? 'text-success'
                              : result === 'FAIL'
                                ? 'text-danger'
                                : 'text-muted';

                          return (
                            <tr key={m.subject_id}>
                              <td>{m.subject_name}</td>
                              <td className="fw-semibold">{markText}</td>
                              <td className={`${cls} fw-semibold`}>{result}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <th>Total</th>
                          <th colSpan={2}>
                            {selectedReport.total} / {selectedReport.total_out_of}
                          </th>
                        </tr>
                        <tr>
                          <th>Average</th>
                          <th colSpan={2}>{selectedReport.average}</th>
                        </tr>
                        <tr>
                          <th>Rank</th>
                          <th colSpan={2}>{selectedReport.rank}</th>
                        </tr>
                        <tr>
                          <th>Status</th>
                          <th
                            colSpan={2}
                            className={
                              selectedReport.status === 'PASS'
                                ? 'text-success fw-semibold'
                                : 'text-danger fw-semibold'
                            }
                          >
                            {selectedReport.status}
                          </th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div id="sheetPlaceholder" className="text-muted small">
                  Choose a student to view the report.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
