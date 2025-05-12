import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContent);
  const [examData, setExamData] = useState({
    questions: [],
    duration: 0,
    title: '',
    attemptId: null
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [serverTime, setServerTime] = useState(0);
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Automatic submission when time expires
  const handleTimeExpired = async () => {
    try {
      // Get latest responses from localStorage
      const savedData = localStorage.getItem(`examAttempt-${examId}`);
      const currentResponses = savedData ? JSON.parse(savedData).responses : {};
      
      // Submit responses to backend
      await axios.post(
        `${backendUrl}/api/responses/${examId}/batch`,
        { responses: currentResponses },
        { withCredentials: true }
      );
      
      // Clean up localStorage
      localStorage.removeItem(`examAttempt-${examId}`);
      
      // Clean up socket
      if (socket) {
        socket.emit('leave-exam-room');
        socket.disconnect();
      }
      
      // Show feedback and redirect
      toast.info('Exam time has expired. Your responses have been submitted.');
      navigate('/student-dashboard/exams');
    } catch (error) {
      console.error('Auto-submission error:', error);
      toast.error('Error submitting responses automatically. Please contact support.');
      
      // Even if submission fails, we should navigate away
      navigate('/student-dashboard/exams');
    }
  };
  
  // Initialize WebSocket and exam data
  useEffect(() => {
    let socketInstance = null;
    
    const initializeExam = async () => {
      setIsLoading(true);
      try {
        // 1. Get active attempt
        const { data } = await axios.get(
          `${backendUrl}/api/exams/${examId}/attempt`,
          { withCredentials: true }
        );

        // 2. Store attempt ID
        const attemptId = data.attempt._id;
        
        // 3. Get exam details and questions
        const [examRes, questionsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/exams/${examId}`, { withCredentials: true }),
          axios.get(`${backendUrl}/api/questions/${examId}/questions`, { withCredentials: true })
        ]);

        // 4. Initialize state
        setExamData({
          questions: questionsRes.data.questions,
          duration: examRes.data.duration,
          title: examRes.data.title,
          attemptId
        });

        // 5. Initialize WebSocket
        socketInstance = io(backendUrl);
        socketInstance.on('connect', () => {
          console.log('Socket connected:', socketInstance.id);
          socketInstance.emit('join-exam-room', attemptId);
        });
        
        socketInstance.on('timer-update', (time) => {
          console.log('Timer update:', time);
          setServerTime(time);
        });
        
        socketInstance.on('time-expired', () => {
          console.log('Time expired event received');
          handleTimeExpired();
        });
        
        socketInstance.on('exam-error', (error) => {
          console.error('Exam error:', error);
          toast.error(error.message || 'An error occurred with the exam');
          navigate('/student-dashboard/exams');
        });
        
        setSocket(socketInstance);

        // 6. Initialize responses from localStorage
        const saved = localStorage.getItem(`examAttempt-${examId}`);
        if (saved) {
          const savedData = JSON.parse(saved);
          setResponses(savedData.responses || {});
          setCurrentQuestion(savedData.currentQuestion || 0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Exam initialization error:', error);
        toast.error('Failed to initialize exam');
        navigate('/student-dashboard/exams');
      }
    };

    initializeExam();

    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        socketInstance.emit('leave-exam-room');
        socketInstance.disconnect();
      }
    };
  }, [examId, backendUrl, navigate]);

  // Save responses to localStorage
  useEffect(() => {
    if (examData.attemptId) {
      localStorage.setItem(`examAttempt-${examId}`, JSON.stringify({
        responses,
        currentQuestion,
        attemptId: examData.attemptId
      }));
    }
  }, [responses, currentQuestion, examId, examData.attemptId]);
    
  // Answer selection handler
  const handleAnswerSelect = (optionIndex) => {
    if (!examData.questions[currentQuestion]) return;
    
    const questionId = examData.questions[currentQuestion]._id;
    const newResponses = { ...responses };

    if (examData.questions[currentQuestion].questionType === 'msq') {
      // Multiple select question
      newResponses[questionId] = newResponses[questionId]?.includes(optionIndex)
        ? newResponses[questionId].filter(i => i !== optionIndex)
        : [...(newResponses[questionId] || []), optionIndex];
    } else {
      // Single select question
      newResponses[questionId] = [optionIndex];
    }

    setResponses(newResponses);
  };

  // Check if an option is selected
  const isOptionSelected = (questionId, optionIndex) => {
    // Ensure we always return a boolean value
    return responses[questionId] ? responses[questionId].includes(optionIndex) : false;
  };

  // Handle review navigation
  const handleReviewClick = async () => {
    // Using navigate function inside an event handler is correct
    navigate(`/student-dashboard/exams/${examId}/review`);
  };

  // Timer formatting
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="p-6">Loading exam questions...</div>;
  }

  if (!examData.questions.length) {
    return <div className="p-6">No questions found for this exam.</div>;
  }

  return (
    <div className="p-6">
      {/* Timer Header */}
      <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="text-xl font-bold">{examData.title}</h2>
        <div className="text-center">
          <div className="text-2xl">{formatTime(serverTime)}</div>
          <div className="text-sm">Hrs | Min | Sec</div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white p-4 grid grid-cols-5 gap-2">
        {examData.questions.map((question, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestion(index)}
            className={`p-2 rounded cursor-pointer ${
              responses[question._id]?.length > 0 
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
        {examData.questions[currentQuestion] && (
          <>
            <h3 className="text-lg font-semibold mb-4">
              Q{currentQuestion + 1}. {examData.questions[currentQuestion].questionText}
            </h3>

            <div className="space-y-2">
              {examData.questions[currentQuestion].options.map((option, index) => {
                const questionId = examData.questions[currentQuestion]._id;
                return (
                  <label key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <input
                      type={examData.questions[currentQuestion].questionType === 'msq' ? 'checkbox' : 'radio'}
                      checked={isOptionSelected(questionId, index)}
                      onChange={() => handleAnswerSelect(index)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="cursor-pointer">{option.text}</span>
                  </label>
                );
              })}
            </div>

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
                onClick={handleReviewClick}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer"
              >
                Review & Submit ►
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamInterface;