import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CreateExam() {
  const navigate = useNavigate();
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
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setExam({ ...exam, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/teacher/exams', exam);
      navigate('/teacher/exams');
    } catch (error) {
      setError('Failed to create exam. Please try again.');
      console.error('Error creating exam:', error);
    }
  };
  
  return (
    <div className="create-exam">
      <h1>Create New Exam</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Exam Title*</label>
          <input
            id="title"
            name="title"
            type="text"
            value={exam.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="subject">Subject*</label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={exam.subject}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={exam.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="duration">Duration (minutes)*</label>
            <input
              id="duration"
              name="duration"
              type="number"
              min="1"
              value={exam.duration}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group half">
            <label htmlFor="passingScore">Passing Score (%)*</label>
            <input
              id="passingScore"
              name="passingScore"
              type="number"
              min="0"
              max="100"
              value={exam.passingScore}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="startDate">Start Date & Time</label>
            <input
              id="startDate"
              name="startDate"
              type="datetime-local"
              value={exam.startDate}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group half">
            <label htmlFor="endDate">End Date & Time</label>
            <input
              id="endDate"
              name="endDate"
              type="datetime-local"
              value={exam.endDate}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="instructions">Instructions</label>
          <textarea
            id="instructions"
            name="instructions"
            value={exam.instructions}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="status">Status*</label>
          <select
            id="status"
            name="status"
            value={exam.status}
            onChange={handleChange}
            required
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
        
        <div className="form-buttons">
          <button type="button" onClick={() => navigate('/teacher/exams')} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-submit">
            Create Exam
          </button>
        </div>
      </form>
    </div>
  );
}