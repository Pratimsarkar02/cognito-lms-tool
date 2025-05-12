import { useContext, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const ExamReview = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContent);
  const [questions, setQuestions] = useState([]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [socket, setSocket] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  
  // Reference for the header element
  const headerRef = useRef(null);

  // Get responses from localStorage
  const [responses, setResponses] = useState({});

  useEffect(() => {
    // Load responses from localStorage
    const attemptData = localStorage.getItem(`examAttempt-${examId}`);
    if (attemptData) {
      const parsedData = JSON.parse(attemptData);
      setResponses(parsedData.responses || {});
      if (parsedData.attemptId) {
        setAttemptId(parsedData.attemptId);
      }
    }
  }, [examId]);

    // Separate handler for time expiration
    const handleTimeExpired = async () => {
      try {
        // Get latest responses from localStorage
        const savedData = localStorage.getItem(`examAttempt-${examId}`);
        const currentResponses = savedData ? JSON.parse(savedData).responses : responses;
        
        // Submit responses to backend
        await axios.post(
          `${backendUrl}/api/responses/${examId}/batch`,
          { responses: currentResponses },
          { withCredentials: true }
        );
        
        // Clean up localStorage
        localStorage.removeItem(`examAttempt-${examId}`);
        
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
    
  useEffect(() => {
    const initializeReview = async () => {
      try {
        // Get attempt details
        const { data } = await axios.get(
          `${backendUrl}/api/exams/${examId}/attempt`,
          { withCredentials: true }
        );

        const currentAttemptId = data.attempt._id;
        setAttemptId(currentAttemptId);

        // Initialize WebSocket
        const newSocket = io(backendUrl);
        newSocket.emit('join-exam-room', currentAttemptId);
        newSocket.on('timer-update', setRemainingTime);
        newSocket.on('time-expired', handleTimeExpired);
        
        setSocket(newSocket);

        // Load questions
        const questionsRes = await axios.get(
          `${backendUrl}/api/questions/${examId}/questions`,
          { withCredentials: true }
        );
        setQuestions(questionsRes.data.questions);

      } catch (error) {
        toast.error('Failed to load review data');
        navigate('/student-dashboard/exams');
      }
    };

    initializeReview();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [examId, backendUrl, navigate]);
  
  // Set up scroll event listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerRect = headerRef.current.getBoundingClientRect();
        if (headerRect.top <= 0) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleFinalSubmit = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/responses/${examId}/batch`,
        { responses },
        { withCredentials: true }
      );
      
      localStorage.removeItem(`examAttempt-${examId}`);
      toast.success('Exam submitted successfully!');
      navigate('/student-dashboard/exams');
    } catch (error) {
      toast.error('Submission failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(responses).filter(key => responses[key]?.length > 0).length;
  };

  return (
    <div className="p-6">
      {/* Spacer div that takes up same height as header when header becomes fixed */}
      {isSticky && (
        <div className=" mb-6"></div> 
      )}
      
      {/* Header with exam info and timer */}
      <div 
        ref={headerRef}
        className={`bg-gray-800 text-white p-4 rounded-lg flex justify-between items-center mb-6
          ${isSticky ? 'relative top-0 left-0 right-0 z-10 rounded-none px-6' : ''}`}
      >
        <div>
          <h1 className="text-2xl font-bold">Review Your Exam</h1>
          <p className="text-gray-300">
            {getAnsweredCount()} of {questions.length} questions answered
          </p>
        </div>
        <div className="text-center">
          <div className="text-2xl">{formatTime(remainingTime)}</div>
          <div className="text-sm">Hrs | Min | Sec</div>
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
                    ? 'bg-blue-50 border border-blue-200' 
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
          <div className="mt-2 text-sm text-gray-500">
            {!responses[question._id] || responses[question._id].length === 0 
              ? <span className="text-red-500">Not answered</span> 
              : <span className="text-green-500">Answered</span>}
          </div>
        </div>
      ))}

      <div className="flex gap-4 justify-end mt-6">
        <button
          onClick={navigate(-1)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Back to Exam
        </button>
        <button
          onClick={handleFinalSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Final Submit
        </button>
      </div>
    </div>
  );
};

export default ExamReview;