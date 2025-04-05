import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function QuestionForm({ mode = 'create' }) {
  const { examId, questionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === 'edit');
  const [error, setError] = useState('');
  
  const [question, setQuestion] = useState({
    examId: examId,
    text: '',
    type: 'multiple_choice',
    points: 1,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    correctAnswer: true, // For true/false
    answerKeywords: [''] // For short_answer
  });
  
  useEffect(() => {
    // If editing, fetch question data
    if (mode === 'edit' && questionId) {
      const fetchQuestion = async () => {
        try {
          const response = await axios.get(`/api/teacher/questions/${questionId}`);
          setQuestion(response.data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching question:', error);
          setError('Failed to load question data');
          setLoading(false);
        }
      };
      
      fetchQuestion();
    }
  }, [mode, questionId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuestion({ ...question, [name]: value });
  };
  
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...question.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setQuestion({ ...question, options: updatedOptions });
  };
  
  const handleCorrectOptionChange = (index) => {
    const updatedOptions = question.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));
    setQuestion({ ...question, options: updatedOptions });
  };
  
  const handleKeywordChange = (index, value) => {
    const updatedKeywords = [...question.answerKeywords];
    updatedKeywords[index] = value;
    setQuestion({ ...question, answerKeywords: updatedKeywords });
  };
  
  const addKeyword = () => {
    setQuestion({
      ...question,
      answerKeywords: [...question.answerKeywords, '']
    });
  };
  
  const removeKeyword = (index) => {
    const updatedKeywords = [...question.answerKeywords];
    updatedKeywords.splice(index, 1);
    setQuestion({ ...question, answerKeywords: updatedKeywords });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        await axios.post(`/api/teacher/exams/${examId}/questions`, question);
      } else {
        await axios.put(`/api/teacher/questions/${questionId}`, question);
      }
      navigate(`/teacher/exams/${examId}/questions`);
    } catch (error) {
      console.error('Error saving question:', error);
      setError('Failed to save question. Please try again.');
    }
  };
  
  if (loading) return <div>Loading question data...</div>;
  
  return (
    <div className="question-form">
      <h1>{mode === 'create' ? 'Create New Question' : 'Edit Question'}</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="text">Question Text*</label>
          <textarea
            id="text"
            name="text"
            value={question.text}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="type">Question Type*</label>
            <select
              id="type"
              name="type"
              value={question.type}
              onChange={handleChange}
              required
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short Answer</option>
            </select>
          </div>
          
          <div className="form-group half">
            <label htmlFor="points">Points*</label>
            <input
              id="points"
              name="points"
              type="number"
              min="1"
              value={question.points}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        {question.type === 'multiple_choice' && (
          <div className="options-section">
            <h3>Answer Options</h3>
            {question.options.map((option, index) => (
              <div key={index} className="option-row">
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required
                />
                <label className="radio-label">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={option.isCorrect}
                    onChange={() => handleCorrectOptionChange(index)}
                    required
                  />
                  Correct Answer
                </label>
              </div>
            ))}
          </div>
        )}
        
        {question.type === 'true_false' && (
          <div className="true-false-section">
            <h3>Correct Answer</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="correctAnswer"
                  value="true"
                  checked={question.correctAnswer === true}
                  onChange={() => setQuestion({ ...question, correctAnswer: true })}
                  required
                />
                True
              </label>
              <label>
                <input
                  type="radio"
                  name="correctAnswer"
                  value="false"
                  checked={question.correctAnswer === false}
                  onChange={() => setQuestion({ ...question, correctAnswer: false })}
                />
                False
              </label>
            </div>
          </div>
        )}
        
        {question.type === 'short_answer' && (
          <div className="keywords-section">
            <h3>Answer Keywords</h3>
            <p className="help-text">
              Add keywords that should be present in a correct answer.
            </p>
            {question.answerKeywords.map((keyword, index) => (
              <div key={index} className="keyword-row">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(index, e.target.value)}
                  placeholder="Keyword"
                  required
                />
                {question.answerKeywords.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeKeyword(index)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={addKeyword}
              className="btn-add"
            >
              Add Keyword
            </button>
          </div>
        )}
        
        <div className="form-buttons">
          <button 
            type="button" 
            onClick={() => navigate(`/teacher/exams/${examId}/questions`)}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button type="submit" className="btn-submit">
            {mode === 'create' ? 'Create Question' : 'Update Question'}
          </button>
        </div>
      </form>
    </div>
  );
}