import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchExams();
  }, []);
  
  const fetchExams = async () => {
    try {
      const response = await axios.get('/api/teacher/exams');
      setExams(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setLoading(false);
    }
  };
  
  const deleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await axios.delete(`/api/teacher/exams/${examId}`);
        setExams(exams.filter(exam => exam.id !== examId));
      } catch (error) {
        console.error('Error deleting exam:', error);
      }
    }
  };
  
  if (loading) return <div>Loading exams...</div>;
  
  return (
    <div className="exam-management">
      <div className="header-actions">
        <h1>Exam Management</h1>
        <Link to="/teacher/exams/create" className="btn-create">
          Create New Exam
        </Link>
      </div>
      
      {exams.length === 0 ? (
        <p>No exams created yet.</p>
      ) : (
        <div className="exams-list">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Duration (mins)</th>
                <th>Total Questions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td>{exam.title}</td>
                  <td>{exam.subject}</td>
                  <td>{exam.duration}</td>
                  <td>{exam.totalQuestions}</td>
                  <td>
                    <span className={`status-badge ${exam.status}`}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/teacher/exams/${exam.id}`} className="btn-view">
                      View
                    </Link>
                    <Link to={`/teacher/exams/edit/${exam.id}`} className="btn-edit">
                      Edit
                    </Link>
                    <button onClick={() => deleteExam(exam.id)} className="btn-delete">
                      Delete
                    </button>
                    <Link to={`/teacher/exams/${exam.id}/questions`} className="btn-questions">
                      Manage Questions
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}