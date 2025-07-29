import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BookOpen, Calendar, Clock, Percent } from 'lucide-react';

const ExamDetails = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
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
    } catch (error) {
      console.error('Fetch Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to fetch exam details');
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.response?.data?.message || 'Failed to fetch exam details'
      }));
    }
  }, [backendUrl, examId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  if (state.isLoading) {
    return <div className="p-6 text-center">Loading exam details...</div>;
  }

  if (state.error) {
    return <div className="p-6 text-center text-red-600">{state.error}</div>;
  }

  if (!state.exam) {
    return <div className="p-6 text-center">No exam found with the provided ID.</div>;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-md border border-indigo-100 p-6">
      {/* Exam Metadata */}
      <div>
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold text-indigo-900">{state.exam.title}</h1>
          <p className="mt-1 text-indigo-700 italic prose max-w-none"
          dangerouslySetInnerHTML={{ __html: state.exam.description || 'No description provided' }}
          />
        </div>
        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-500" />
            <div>
              <p className="text-sm text-indigo-800 font-semibold">Will Start At</p>
              <p className="text-gray-600 text-sm">
                {new Date(state.exam.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-6 h-6 text-indigo-500" />
            <div>
              <p className="text-sm text-indigo-800 font-semibold">Duration</p>
              <p className="text-gray-600 text-sm">{state.exam.duration} mins</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <div>
              <p className="text-sm text-indigo-800 font-semibold">Total Marks</p>
              <p className="text-gray-600 text-sm">{state.exam.totalMarks}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Percent className="w-6 h-6 text-indigo-500" />
            <div>
              <p className="text-sm text-indigo-800 font-semibold">Negative Marking</p>
              <p className="text-gray-600 text-sm">{state.exam.isNegativeMarking ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-right">
        <button
          onClick={() => navigate(`/student-dashboard/exams/${examId}/instructions`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md cursor-pointer"
        >
          Continue to Instructions
        </button>
      </div>
    </div>
  );
};

export default ExamDetails;