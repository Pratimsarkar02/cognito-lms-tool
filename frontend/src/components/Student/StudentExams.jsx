// components/student/StudentExams.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get('/api/student/exams');
        setExams(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setLoading(false);
      }
    };
    
    fetchExams();
  }, []);
  
  if (loading) return <div>Loading exams...</div>;
  
  return (
    <div className="exams-container">
      <h1>My Upcoming Exams</h1>
      {exams.length === 0 ? (
        <p>No upcoming exams scheduled.</p>
      ) : (
        <div className="exam-list">
          {exams.map((exam) => (
            <div key={exam.id} className="exam-card">
              <h3>{exam.title}</h3>
              <p>Date: {new Date(exam.date).toLocaleDateString()}</p>
              <p>Duration: {exam.duration} minutes</p>
              <p>Status: {exam.status}</p>
              {exam.status === 'open' && (
                <button onClick={() => window.location.href = `/student/exam/${exam.id}`}>
                  Start Exam
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}