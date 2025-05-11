import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const ExamReview = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContent);
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Get responses from localStorage
  const attemptData = JSON.parse(localStorage.getItem(`examAttempt-${examId}`));
  const responses = attemptData?.responses || {};

  console.log("Responses Collection in local storage:", responses);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch questions and attempt details
        const [questionsRes, attemptRes] = await Promise.all([
          axios.get(`${backendUrl}/api/questions/${examId}/questions`),
          axios.get(`${backendUrl}/api/exams/${examId}/attempt`)
        ]);
        
        setQuestions(questionsRes.data.questions);
        setTimeLeft(attemptRes.data.attempt.duration * 60 - 
          Math.floor((Date.now() - new Date(attemptRes.data.attempt.startTime)) / 1000));
      } catch (error) {
        toast.error('Failed to load review data', error);
        navigate('/student-dashboard/exams/:examId');
      }
    };
    loadData();
  }, [examId, backendUrl, navigate]);

  const handleFinalSubmit = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/responses/${examId}/batch`,
        { responses },
        { withCredentials: true }
      );
      toast.success("Exam Submitted Successfully");
      // Clear local storage
      localStorage.removeItem(`examAttempt-${examId}`);
      navigate('/student-dashboard/exams');
    } catch (error) {
      toast.error('Submission failed: ' + error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Your Exam</h1>
        <div className="bg-gray-800 text-white p-2 rounded">
          Time Left: {Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}
        </div>
      </div>

      {questions.map((question, index) => (
        <div key={question._id} className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-semibold mb-2">Q{index+1}. {question.questionText}</h3>
          <div className="space-y-2">
            {question.options.map((option, optIndex) => (
              <div 
                key={optIndex}
                className={`p-2 rounded ${
                  responses[question._id]?.includes(optIndex) 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50'
                }`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type={question.questionType === 'msq' ? 'checkbox' : 'radio'}
                    checked={responses[question._id]?.includes(optIndex)}
                    disabled
                    className="w-4 h-4"
                  />
                  <span>{option.text}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-4 justify-end mt-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 text-white px-4 py-2 rounded cursor-pointer"
        >
          Back to Exam
        </button>
        <button
          onClick={handleFinalSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer"
        >
          Final Submit
        </button>
      </div>
    </div>
  );
};

export default ExamReview;