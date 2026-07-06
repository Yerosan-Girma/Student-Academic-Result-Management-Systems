// Report Card Component
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ReportCard({ studentId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [studentId]);

  const fetchReport = async () => {
    try {
      const response = await axios.get(`/api/reports/student/${studentId}`);
      setReport(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-5">Loading report...</div>;
  if (!report) return <div className="alert alert-warning">No report found</div>;

  return (
    <div className="container mt-5 print-area">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h3 className="mb-0">Academic Report Card</h3>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <h5>Student Information</h5>
              <p><strong>Name:</strong> {report.student.name}</p>
              <p><strong>Enrollment:</strong> {report.student.enrollment_number}</p>
              <p><strong>Email:</strong> {report.student.email}</p>
            </div>
            <div className="col-md-6 text-end">
              <h5>Academic Summary</h5>
              <p><strong>GPA:</strong> <span className="badge bg-success">{report.gpa}</span></p>
              <p><strong>Generated:</strong> {new Date(report.generatedDate).toLocaleDateString()}</p>
            </div>
          </div>

          <hr />

          <h5 className="mt-4">Subject Marks</h5>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Subject</th>
                <th>Test 1</th>
                <th>Test 2</th>
                <th>Assignment</th>
                <th>Final</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {report.marks.map((mark, idx) => (
                <tr key={idx}>
                  <td>{mark.subject_name}</td>
                  <td>{mark.test1}</td>
                  <td>{mark.test2}</td>
                  <td>{mark.assignment}</td>
                  <td>{mark.final_exam}</td>
                  <td><strong>{mark.total}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-center">
            <button className="btn btn-primary me-2" onClick={() => window.print()}>
              Print Report
            </button>
            <button className="btn btn-secondary">Download PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}