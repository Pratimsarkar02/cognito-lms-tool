import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AppContent } from '../../../contexts/AppContext';
import { LoadingSkeleton } from '../../../components/dashboard/LoadingSkeleton';
import { toast } from 'react-toastify';
import { Link, useNavigate, useParams } from 'react-router-dom';

const ExamInstructionsModal = () => {
  const [loading, setLoading] = useState(true);
  const { examId } = useParams();
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const { authState: { userData }, backendUrl } = useContext(AppContent);
  const [state, setState] = useState({
    exam: null,
    isLoading: true,
    error: null
  });

  // Fetch specific exam by ID
  const fetchExam = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data } = await axios.get(`${backendUrl}/api/exams/${examId}`, {
        withCredentials: true
      });
      
      console.log('API Response:', data);

      setState(prev => ({
        ...prev,
        exam: data.exam,
        isLoading: false
      }));
      setLoading(false);
    } catch (error) {
      console.error('Fetch Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to fetch exam details');
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch exam details'
      }));
      setLoading(false);
    }
  }, [backendUrl, examId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  if (loading) return <LoadingSkeleton type="card" />;
  
  if (state.error) {
    return <div className="p-6 text-center text-red-600">{state.error}</div>;
  }

  if (!state.exam) {
    return <div className="p-6 text-center">No exam found with the provided ID.</div>;
  }

  const handleAttempt = async () => {
    try {
      // Create new attempt if none exists
      const { data } = await axios.post(
        `${backendUrl}/api/exams/${examId}/attempt`,
        {},
        { withCredentials: true }
      );
          
      toast.success("Attempt Started. Good Luck!!!");
      navigate(`/student-dashboard/exams/${examId}/attempt`);
      
      if(data.attempt) {

        localStorage.setItem(`examAttempt-${examId}`, JSON.stringify({
          responses: {},
          currentQuestion: 0,
          attemptId: data.attempt._id
        }));
      }
      navigate(`/student-dashboard/exams/${examId}/attempt`);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start attempt');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">General Instructions</h2>
        <div className="mb-4 prose max-w-none "
          dangerouslySetInnerHTML={{ __html: state.exam.instructions || "Please read all instructions carefully before starting the exam."}}
        />
        
        <div className="mt-6 flex items-center gap-4">
          <label>
            <input className='cursor-pointer'
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            {' '}I agree to the terms
          </label>
        </div>

        <div className="mt-6 flex items-center gap-4 place-content-between">
          <Link 
            to={`/student-dashboard/exams/${examId}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to Exam Details
          </Link>
          <button 
            disabled={!agreed}
            onClick={handleAttempt}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Attempt Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructionsModal;