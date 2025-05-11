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
  const { authState:{userData}, backendUrl } = useContext(AppContent);
  const [state, setState] = useState({
    exams: [],
    isLoading: true,
    currentPage: 1,
    totalPages: 1,
    sortBy: '-createdAt',
    searchQuery: '',
    limit: 9
  });

  // Fetch exams with current filters
  const fetchExams = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      let endpoint = '/api/exams/active';
      const params = {
        page: state.currentPage,
        limit: state.limit,
        sortBy: state.sortBy,
        search: state.searchQuery
      };

      if(userData.role === 'Faculty') {
        endpoint = '/api/exams/my-exams';
        params.creatorId = userData._id;
      }
      
      if(userData.role === 'Admin') {
        endpoint = '/api/exams/all';
      }

      const { data } = await axios.get(`${backendUrl}${endpoint}`, {
        params,
        withCredentials: true
      });
      console.log('API Response:', data);

      setState(prev => ({
        ...prev,
        exams: data.exams || [],
        totalPages: data.pagination?.totalPages || 1,
        isLoading: false
      }));
      setLoading(false);
    } catch (error) {
      console.error('Fetch Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to fetch exams');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [backendUrl, state.currentPage, state.sortBy, state.searchQuery, state.limit, userData]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  if (loading) return <LoadingSkeleton type="card" />;

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
    

    if (data.attempt) {
      localStorage.setItem(`examAttempt-${examId}`, JSON.stringify({
        responses: {},
        currentQuestion: 0,
        attemptId: data.attempt._id
      }));
      navigate(`/student-dashboard/exams/${examId}/attempt`);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to start attempt');
  }
};

  // Then modify the return statement:
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">General Instructions</h2>
        {state.exams.map((exam, index) => (
          
          <div key={examId} className="">{index+1}. {exam.instructions}.</div>
          
      ))}
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
            to="/student-dashboard/exams/:examId"
            className="text-blue-600 hover:underline"
          >
            ← Back to Exams
          </Link>
          <button 
          disabled={!agreed}
          onClick={handleAttempt}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            Attempt Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamInstructionsModal;