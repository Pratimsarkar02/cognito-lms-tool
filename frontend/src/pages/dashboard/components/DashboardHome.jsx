// pages/dashboard/components/DashboardHome.jsx
import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import { CardSkeleton } from '../../../components/dashboard/LoadingSkeleton';
import ExamCard from '../../../components/dashboard/ExamCard';
import axios from 'axios';
import { toast } from 'react-toastify';

const DashboardHome = () => {
  const { authState: {userData}, backendUrl } = useContext(AppContent);
  const [state, setState] = useState({
    exams: [],
    isLoading: true,
    currentPage: 1,
    totalPages: 1,
    sortBy: '-createdAt',
    searchQuery: '',
    limit: 9
  });
  const [loading, setLoading] = useState(true);

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

  if (loading) return <CardSkeleton />;

  return (
    <div className="p-6">
      
      <h2 className="text-2xl font-bold mb-6">Upcoming Exams</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {state.exams.map(exam => (
          <ExamCard 
            key={exam._id}
            exam={exam}
            userRole={userData?.role}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardHome;