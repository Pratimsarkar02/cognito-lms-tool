import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function EditExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 60,
    passingScore: 60,
    startDate: '',
    endDate: '',
    instructions: '',
    status: 'draft'
  });
  
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await axios.get(`/api/teacher/exams/${examId}`);
        const examData = response.data;
        
        // Format dates for datetime-local input
        if (examData.startDate) {
          examData.startDate = new Date(examData.startDate).toISOString().slice(0, 16);
        }
        if (examData.endDate) {
          examData.endDate = new Date(examData.endDate).toISOString().slice(0, 16);
        }
        
        setExam(examData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching exam:', error);
        setError('Failed to load exam data');
        setLoading(false);
      }
    };
    
    fetchExam();
  }, [examId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setExam({ ...exam, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/teacher/exams/${examId}`, exam);
      navigate('/teacher/exams');
    } catch (error) {
      setError('Failed to update exam. Please try again.');
      console.error('Error updating exam:', error);
    }
  };
  
  if (loading) return <div>Loading exam data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="edit-exam">
      <h1>Edit Exam</h1>
      
      <form onSubmit={handleSubmit}>
        {/* Same form fields as CreateExam component */}
        {/* ... */}
        
        <div className="form-buttons">
          <button type="button" onClick={() => navigate('/teacher/exams')} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-submit">
            Update Exam
          </button>
        </div>
      </form>
    </div>
  );
}