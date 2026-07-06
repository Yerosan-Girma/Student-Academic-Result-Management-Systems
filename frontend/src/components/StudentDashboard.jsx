// Student Dashboard Component
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await axios.get('/api/students/current');
      setStudent(response.data);
      
      const marksResponse = await axios.get(`/api/marks/student/${response.data.id}`);
      setMarks(marksResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-5">Loading...</div>;

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8">
          <h2>Welcome, {student?.name}!</h2>
          <p className="text-muted">Enrollment: {student?.enrollment_number}</p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-primary">View Report Card</button>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-12">
          <h4>Your Marks</h4>
          <table className="table table-striped">
            <thead className="table-dark">
              <tr>
                <th>Subject</th>
                <th>Test 1</th>
                <th>Test 2</th>
                <th>Assignment</th>
                <th>Final Exam</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((mark) => (
                <tr key={mark.id}>
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
        </div>
      </div>
    </div>
  );
}