import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function QuestionManagement() {
  const { examId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch exam details
        const examResponse = await axios.get(`/api/teacher/exams/${examId}`);
        setExamTitle(examResponse.data.title);
        
        // Fetch questions for this exam
        const questionsResponse = await axios.get(`/api/teacher/exams/${examId}/questions`);
        setQuestions(questionsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load exam questions');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [examId]);
  
  const deleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await axios.delete(`/api/teacher/questions/${questionId}`);
        setQuestions(questions.filter(q => q.id !== questionId));
      } catch (error) {
        console.error('Error deleting question:', error);
        setError('Failed to delete question');
      }
    }
  };
  
  if (loading) return <div>Loading questions...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="question-management">
      <div className="header-actions">
        <h1>Questions for: {examTitle}</h1>
        <Link to={`/teacher/exams/${examId}/questions/create`} className="btn-create">
          Add New Question
        </Link>
      </div>
      
      {questions.length === 0 ? (
        <p>No questions added yet. Click the button above to add questions.</p>
      ) : (
        <div className="questions-list">
          {questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <h3>Question {index + 1}</h3>
                <div className="question-actions">
                  <Link to={`/teacher/questions/edit/${question.id}`} className="btn-edit">
                    Edit
                  </Link>
                  <button onClick={() => deleteQuestion(question.id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="question-content">
                <p><strong>Question:</strong> {question.text}</p>
                <p><strong>Type:</strong> {question.type}</p>
                <p><strong>Points:</strong> {question.points}</p>
                
                {question.type === 'multiple_choice' && (
                  <div className="options-list">
                    <p><strong>Options:</strong></p>
                    <ul>
                      {question.options.map((option, i) => (
                        <li key={i} className={option.isCorrect ? 'correct-option' : ''}>
                          {option.text} {option.isCorrect && '✓'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {question.type === 'true_false' && (
                  <p><strong>Correct Answer:</strong> {question.correctAnswer ? 'True' : 'False'}</p>
                )}
                
                {question.type === 'short_answer' && (
                  <p><strong>Answer Keywords:</strong> {question.answerKeywords.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}