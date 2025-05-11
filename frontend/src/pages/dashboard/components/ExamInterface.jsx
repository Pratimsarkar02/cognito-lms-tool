// ExamInterface.jsx
import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContent);
  const [examData, setExamData] = useState({
    questions: [],
    duration: 0,
    title: ''
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [responses, setResponses] = useState(() => {
  const saved = localStorage.getItem(`examAttempt-${examId}`);
  const initialResponses = saved ? JSON.parse(saved).responses : {};
  
  // Initialize empty arrays for all questions
  examData.questions?.forEach(question => {
    if (!initialResponses[question._id]) {
      initialResponses[question._id] = [];
    }
  });

  return initialResponses;
});

  // Load exam data and initialize timer
  useEffect(() => {
    const initializeExam = async () => {
      try {
        // Fetch exam details and questions
        const [examRes, questionsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/exams/active`, { withCredentials: true }),
          axios.get(`${backendUrl}/api/questions/${examId}/questions`, { withCredentials: true })
        ]);

        const { duration, title } = examRes.data;
        setExamData({
          questions: questionsRes.data.questions,
          duration,
          title
        });

        // Initialize timer from localStorage or fresh start
        const savedAttempt = localStorage.getItem(`examAttempt-${examId}`);
        const initialTime = savedAttempt?.duration || duration * 60;
        setTimeLeft(initialTime);
      } catch (error) {
        toast.error('Failed to load exam data', error);
        navigate('/student-dashboard/exams');
      }
    };

    initializeExam();
  }, [examId, backendUrl, navigate]);

  // Timer management
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Auto-submit when time expires
        if(newTime <= 0) {
          handleSubmit();
          return 0;
        }
        
        // Save time to localStorage
        localStorage.setItem(`examAttempt-${examId}`, JSON.stringify({
          responses,
          currentQuestion,
          timeLeft: newTime
        }));
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [responses, currentQuestion, examId]);

  // Save responses to localStorage on change
  useEffect(() => {
    localStorage.setItem(`examAttempt-${examId}`, JSON.stringify({
      responses,
      currentQuestion,
      timeLeft
    }));
  }, [responses, currentQuestion, timeLeft, examId]);
// Initialize local storage properly
useEffect(() => {
  const initializeStorage = async () => {
    const { data } = await axios.get(
      `${backendUrl}/api/exams/${examId}/attempt`,
      { withCredentials: true }
    );
    
    const saved = localStorage.getItem(`examAttempt-${examId}`) || JSON.stringify({
      responses: {},
      currentQuestion: 0,
      attemptId: data.attempt._id,
      startTime: data.attempt.startTime
    });
    
    localStorage.setItem(`examAttempt-${examId}`, saved);
  };
  initializeStorage();
}, [examId, backendUrl]);

  // Handle answer selection
  const handleAnswerSelect = (optionIndex) => {
    const questionId = examData.questions[currentQuestion]._id;
    const newResponses = { ...responses };
    
    if(examData.questions[currentQuestion].questionType === 'msq') {
      // Multiple select
      newResponses[questionId] = newResponses[questionId]?.includes(optionIndex)
        ? newResponses[questionId].filter(i => i !== optionIndex)
        : [...(newResponses[questionId] || []), optionIndex];
    } else {
      // Single select
      newResponses[questionId] = [optionIndex];
    }

    setResponses(newResponses);
  };

  // Format time display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')} : ${String(mins).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;
  };

  // Modified handleSubmit in ExamInterface.jsx
const handleSubmit = () => {
  // Only navigate to review page, don't submit yet
  navigate(`/student-dashboard/exams/${examId}/review`);
};

// Remove the auto-submit from timer effect
useEffect(() => {
  const timerInterval = setInterval(() => {
    setTimeLeft(prev => {
      const newTime = prev - 1;
      if(newTime <= 0) {
        navigate(`/student-dashboard/exams/${examId}/review`);
        return 0;
      }
      return newTime;
    });
  }, 1000);

  return () => clearInterval(timerInterval);
}, [navigate, examId]);

  if (!examData.questions.length) {
    return <div className="p-6">Loading exam questions...</div>;
  }

  return (
    <div className="p-6">
      {/* Timer Header */}
      <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="text-xl font-bold">{examData.title}</h2>
        <div className="text-center">
          <div className="text-2xl">{formatTime(timeLeft)}</div>
          <div className="text-sm">Hrs | Min | Sec</div>
        </div>
      </div>

      {/* Question Navigation Grid */}
      <div className="bg-white p-4 grid grid-cols-5 gap-2">
        {examData.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`p-2 rounded cursor-pointer ${
              responses[examData.questions[index]._id]?.length > 0 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      <div className="bg-white p-6 shadow">
        <h3 className="text-lg font-semibold mb-4">
          Q{currentQuestion + 1}. {examData.questions[currentQuestion].questionText}
        </h3>

        {/* Options */}
        <div className="space-y-2">
          {examData.questions[currentQuestion].options.map((option, index) => (
            <label key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
              <input
                type={examData.questions[currentQuestion].questionType === 'msq' ? 'checkbox' : 'radio'}
                checked={responses[examData.questions[currentQuestion]._id]?.includes(index)}
                onChange={() => handleAnswerSelect(index)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="cursor-pointer">{option.text}</span>
            </label>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between mt-6">
          <button
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← PREV
          </button>
          <button
            disabled={currentQuestion === examData.questions.length - 1}
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            NEXT →
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer"
          >
            Review & Submit ►
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;