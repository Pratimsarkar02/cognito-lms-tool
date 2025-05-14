import { useContext, useEffect, useState, useCallback } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import PropTypes from 'prop-types';
import { PenTool } from 'lucide-react';

const ExamList = () => {
  const { authState:{userData}, backendUrl } = useContext(AppContent);
  const navigate = useNavigate();
  const [state, setState] = useState({
    exams: [],
    isLoading: true,
    currentPage: 1,
    totalPages: 1,
    sortBy: '-createdAt',
    searchQuery: '',
    limit: 9
  });

  // Debounce search input
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

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

      switch(userData?.role) {
        case 'Faculty':
          endpoint = '/api/exams/my-exams';
          params.creatorId = userData._id;
          break;
        case 'Admin':
          endpoint = '/api/exams/all';
          break;
        default:
          endpoint = '/api/exams/active';
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
        currentPage: data.pagination?.currentPage || 1,
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

  // Update handleStartExam in ExamList.jsx
  const handleStartExam = (examId) => {
    navigate(`/student-dashboard/exams/${examId}`);
  };

  // Delete exam handler
  const handleDeleteExam = async (examId) => {
    try {
      await axios.delete(`${backendUrl}/api/exams/${examId}`, {
        withCredentials: true
      });
      toast.success('Exam deleted successfully');
      fetchExams(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deletion failed');
    }
  };

  // Publish exam handler
  const handlePublishExam = async (examId) => {
    try {
      await axios.patch(
        `${backendUrl}/api/exams/${examId}/publish`,
        {},
        { withCredentials: true }
      );
      toast.success('Exam Published');
      fetchExams(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Publish failed');
    }
  };
  
  // Unpublish exam handler
  const handleUnpublishExam = async (examId) => {
    try {
      await axios.patch(
        `${backendUrl}/api/exams/${examId}/unpublish`,
        {},
        { withCredentials: true }
      );
      toast.success('Exam Unpublished');
      fetchExams(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unpublish failed');
    }
  };

  // Edit exam navigation
  const handleEditExam = (examId) => {
    navigate(`/faculty-dashboard/exams/${examId}/edit`);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(newPage, prev.totalPages))
    }));
  };

  // Complete exam status handler
  const handleStatusChange = async (examId, newStatus) => {
    try {
      await axios.patch(`${backendUrl}/api/exams/${examId}/${newStatus}`, {}, 
        { withCredentials: true }
      );
      fetchExams();
      toast.success(`Exam ${newStatus === 'publish' ? 'published' : 'unpublished'}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed');
    }
  };

  // Handle sorting
  const handleSortChange = (e) => {
    setState(prev => ({ ...prev, sortBy: e.target.value }));
  };

  // Debounced search handler
  const handleSearch = useCallback(debounce((query) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      currentPage: 1
    }));
  }, 500), []);

  // Check if user is the creator of an exam
  const isExamCreator = (exam) => {
    // First check if createdBy exists and matches
    if (exam.createdBy && (exam.createdBy === userData._id || exam.createdBy._id === userData._id)) {
      return true;
    }
    // Then check if creatorId exists and matches
    if (exam.creatorId && exam.creatorId === userData._id) {
      return true;
    }
    return false;
  };

  // Loading skeleton
  const renderSkeletons = () => (
    Array(state.limit).fill().map((_, idx) => (
      <div key={idx} className="bg-white p-4 rounded-lg shadow">
        <Skeleton height={24} width="60%" className="mb-2" />
        <Skeleton height={16} width="40%" />
        <div className="mt-3">
          <Skeleton height={36} width="100%" />
        </div>
      </div>
    ))
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search exams..."
          className="w-full md:w-96 p-3 border rounded-lg"
          onChange={(e) => handleSearch(e.target.value)}
        />
        {(userData.role === "Faculty") && (
          <button
            onClick={() => navigate("create")}
            className="ml-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            Create New Exam
          </button>
        )}
      </div>

      <div className="overflow-x-auto exam-table">
        <table className="w-full bg-white rounded-lg shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">SL No.</th>
              <th className="p-3 text-left">Exam Title</th>
              <th className="p-3 text-left">Start Date</th>
              <th className="p-3 text-left">End Date</th>
              <th className="p-3 text-left">Actions</th>
              {(userData.role === "Faculty" || userData.role === "Admin") && (
                <th className="p-3 text-left">Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {state.exams.map((exam, index) => (
              <tr key={exam._id} className="border-b">
                <td className="p-3">{index + 1}.</td>
                <td className="p-3 font-medium">{exam.title}</td>
                <td className="p-3">
                  {new Date(exam.startTime)
                    .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                    .slice(0, -12)}
                </td>
                <td className="p-3">
                  {new Date(exam.endTime)
                    .toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
                    .slice(0, -12)}
                </td>
                <td className="p-3 flex gap-2">
                  {userData.role === "Student" && (
                    <button
                      onClick={() => handleStartExam(exam._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
                    >
                      <PenTool className="relative inline mr-1" />
                      Attempt
                    </button>
                  )}
                  
                  {/* Updated this conditional to use our helper function */}
                  {isExamCreator(exam) && (
                    <>
                      <button
                        onClick={() => handleEditExam(exam._id)}
                        className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  
                  {userData.role === "Admin" && !isExamCreator(exam) && (
                    <button
                      onClick={() =>
                        navigate(`/admin-dashboard/users/${exam.createdBy ? exam.createdBy._id || exam.createdBy : exam.creatorId}`)
                      }
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                      View Creator
                    </button>
                  )}
                </td>
                <td className="p-3">
                  {(exam.status === "draft" && (isExamCreator(exam) || userData.role === 'Admin')) && (
                    <button
                      onClick={() => handlePublishExam(exam._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                  {(exam.status === "published" && (isExamCreator(exam) || userData.role === 'Admin')) && (
                    <button
                      onClick={() => handleUnpublishExam(exam._id)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    >
                      Unpublish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Separate ExamCard component
const ExamCard = ({ exam, userRole, onStart, onEdit, onDelete, onPublish }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="font-semibold text-lg">{exam.title}</h3>
    <div className="text-sm text-gray-600 space-y-1 mt-2">
      <p>Starts: {new Date(exam.startTime).toLocaleDateString()}</p>
      <p>Duration: {exam.duration} mins</p>
      {exam.status && <p>Status: {exam.status}</p>}
    </div>

    {/* Student Actions */}
    {userRole === 'Student' && (
      <button 
        onClick={onStart}
        className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
      >
        Start Exam
      </button>
    )}

    {/* Faculty/Admin Actions */}
    {(userRole === 'Faculty' || userRole === 'Admin') && (
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={onEdit}
          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
        >
          Edit
        </button>
        
        <button
          onClick={onDelete}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Delete
        </button>

        {exam.status === 'draft' && (
          <button
            onClick={onPublish}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Publish
          </button>
        )}

        {exam.status === 'published' && (
          <button
            onClick={onPublish}
            className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
          >
            Unpublish
          </button>
        )}
      </div>
    )}
  </div>
);

ExamCard.propTypes = {
  exam: PropTypes.shape({
    title: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    duration: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  userRole: PropTypes.string.isRequired,
  onStart: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
};

export default ExamList;