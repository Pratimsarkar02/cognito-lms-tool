import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContent } from '../../../contexts/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BookOpen, Calendar, Clock, Percent } from 'lucide-react';

const ExamDetails = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const {authState:{userData}, backendUrl} = useContext(AppContent);

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
    } catch (error) {
      console.error('Fetch Error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to fetch exams');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [backendUrl, state.currentPage, state.sortBy, state.searchQuery, state.limit, userData]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-md border border-indigo-100 p-6">
      {/* Exam Metadata */}
      {state.exams.map((exam, index) => (
        <div key={exam._id}>
        {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-indigo-900">{exam.title}</h1>
        <p className="mt-1 text-indigo-700 italic">{exam.description}</p>
      </div>
      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-indigo-500" />
          <div>
            <p className="text-sm text-indigo-800 font-semibold">Will Start At</p>
            <p className="text-gray-600 text-sm">{new Date(exam.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-6 h-6 text-indigo-500" />
          <div>
            <p className="text-sm text-indigo-800 font-semibold">Duration</p>
            <p className="text-gray-600 text-sm">{exam.duration} mins</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-indigo-500" />
          <div>
            <p className="text-sm text-indigo-800 font-semibold">Total Marks</p>
            <p className="text-gray-600 text-sm">{exam.totalMarks}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Percent className="w-6 h-6 text-indigo-500" />
          <div>
            <p className="text-sm text-indigo-800 font-semibold">Negative Marking</p>
            <p className="text-gray-600 text-sm">{exam.isNegativeMarking ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
      </div>
      ))}

<div className="text-right">
        <button
          onClick={() => navigate(`instructions`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md cursor-pointer"
        >
          Continue to Instructions
        </button>
      </div>
    </div>
  );
};

export default ExamDetails;