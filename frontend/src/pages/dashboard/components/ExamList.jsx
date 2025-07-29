import { useContext, useEffect, useState, useCallback } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { 
  Edit, 
  PenTool, 
  Trash, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search,
  Filter,
  X,
  Plus
} from 'lucide-react';

const ExamList = () => {
  const { authState: { userData }, backendUrl } = useContext(AppContent);
  const navigate = useNavigate();

  // FIXED: All hooks at top level, no conditional calls
  const [state, setState] = useState({
    exams: [],
    isLoading: true,
    currentPage: 1,
    totalPages: 1,
    sortBy: '-createdAt',
    searchQuery: '',
    limit: 10
  });

  // Separate search input state to prevent text disappearing
  const [searchInput, setSearchInput] = useState('');

  // FIXED: Stable debounce function
  const debounce = useCallback((func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  }, []);

  // FIXED: Properly structured fetch function
  const fetchExams = useCallback(async (pageNumber, sortByValue, searchValue, limitValue) => {
    if (!userData) return; // Early exit if no user data
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      let endpoint = '/api/exams/active';
      const params = {
        page: pageNumber || state.currentPage,
        limit: limitValue || state.limit,
        sortBy: sortByValue || state.sortBy,
        search: searchValue || state.searchQuery
      };

      switch(userData.role) {
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

      setState(prev => ({
        ...prev,
        exams: data.exams || [],
        totalPages: data.pagination?.totalPages || 1,
        currentPage: data.pagination?.currentPage || pageNumber || 1,
        isLoading: false
      }));
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch exams');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [backendUrl, userData, state.currentPage, state.limit, state.sortBy, state.searchQuery]);

  // FIXED: useEffect with proper dependencies
  useEffect(() => {
    if (userData) {
      fetchExams();
    }
  }, [userData]); // Only trigger when userData changes

  // FIXED: Debounced search with stable function
  const debouncedSearch = useCallback(
    debounce((query) => {
      setState(prev => ({ ...prev, searchQuery: query, currentPage: 1 }));
      fetchExams(1, state.sortBy, query, state.limit);
    }, 500),
    [debounce, state.sortBy, state.limit, fetchExams]
  );

  // FIXED: Search handler that doesn't clear input
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value); // Update input immediately for UI
    debouncedSearch(value); // Trigger debounced search
  }, [debouncedSearch]);

  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchInput('');
    setState(prev => ({ ...prev, searchQuery: '', currentPage: 1 }));
    fetchExams(1, state.sortBy, '', state.limit);
  }, [state.sortBy, state.limit, fetchExams]);

  // FIXED: Sort handler
  const handleSortChange = useCallback((e) => {
    const newSortBy = e.target.value;
    setState(prev => ({ ...prev, sortBy: newSortBy, currentPage: 1 }));
    fetchExams(1, newSortBy, state.searchQuery, state.limit);
  }, [state.searchQuery, state.limit, fetchExams]);

  // FIXED: Pagination handler
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > state.totalPages) return;
    setState(prev => ({ ...prev, currentPage: newPage }));
    fetchExams(newPage, state.sortBy, state.searchQuery, state.limit);
  }, [state.totalPages, state.sortBy, state.searchQuery, state.limit, fetchExams]);

  // Items per page handler
  const handleLimitChange = useCallback((e) => {
    const newLimit = parseInt(e.target.value);
    setState(prev => ({ ...prev, limit: newLimit, currentPage: 1 }));
    fetchExams(1, state.sortBy, state.searchQuery, newLimit);
  }, [state.sortBy, state.searchQuery, fetchExams]);

  // Event handlers
  const handleStartExam = useCallback((examId) => {
    navigate(`/student-dashboard/exams/${examId}`);
  }, [navigate]);

  const handleEditExam = useCallback((examId) => {
    const dashboardPrefix = userData.role.toLowerCase();
    navigate(`/${dashboardPrefix}-dashboard/exams/${examId}/edit`);
  }, [userData, navigate]);

  const handleDeleteExam = useCallback(async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    
    try {
      await axios.delete(`${backendUrl}/api/exams/${examId}`, {
        withCredentials: true
      });
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deletion failed');
    }
  }, [backendUrl, fetchExams]);

  const handlePublishExam = useCallback(async (examId) => {
    try {
      await axios.patch(`${backendUrl}/api/exams/${examId}/publish`, {}, {
        withCredentials: true
      });
      toast.success('Exam Published');
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Publish failed');
    }
  }, [backendUrl, fetchExams]);

  const handleUnpublishExam = useCallback(async (examId) => {
    try {
      await axios.patch(`${backendUrl}/api/exams/${examId}/unpublish`, {}, {
        withCredentials: true
      });
      toast.success('Exam Unpublished');
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unpublish failed');
    }
  }, [backendUrl, fetchExams]);

  // FIXED: Exam creator check
  const isExamCreator = useCallback((exam) => {
    if (!userData || !userData._id || !exam) return false;
    
    const currentUserId = userData._id.toString();
    
    if (exam.createdBy) {
      if (typeof exam.createdBy === 'object' && exam.createdBy._id) {
        return exam.createdBy._id.toString() === currentUserId;
      } else if (typeof exam.createdBy === 'string') {
        return exam.createdBy.toString() === currentUserId;
      }
    }
    
    if (exam.creatorId) {
      return exam.creatorId.toString() === currentUserId;
    }
    
    return false;
  }, [userData]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, state.currentPage - 2);
    let end = Math.min(state.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // FIXED: Loading check after all hooks
  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading user data...</p>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Skeleton height={40} className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Skeleton count={8} height={50} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Management</h1>
        <p className="text-gray-600">
          {userData.role === 'Student' ? 'Available Exams' : 
           userData.role === 'Faculty' ? 'My Created Exams' : 'All System Exams'}
        </p>
      </div>
      <div className="mb-6 flex justify-end items-center">
        {/* Add a create a exam button for faculty or admin */}
        {(userData.role === 'Faculty' || userData.role === 'Admin') && (
          <button
          onClick={() => navigate(`/${userData.role.toLowerCase()}-dashboard/exams/create`)}
          className="mt-4 px-4 py-2 cursor-pointer inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
          <Plus className="h-5 w-5 mr-2" />
            Create New Exam
          </button>
        )}
      </div>
      

      {/* FIXED: Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Search & Filters</h3>
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold">{state.exams.length}</span> exams
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* FIXED: Search Input with stable value */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Exams</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search by exam title..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Sort Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={state.sortBy}
              onChange={handleSortChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="-createdAt">📅 Newest First</option>
              <option value="createdAt">📅 Oldest First</option>
              <option value="title">🔤 Title A-Z</option>
              <option value="-title">🔤 Title Z-A</option>
              <option value="startTime">⏰ Start Date (Asc)</option>
              <option value="-startTime">⏰ Start Date (Desc)</option>
            </select>
          </div>
          
          {/* Items Per Page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
            <select
              value={state.limit}
              onChange={handleLimitChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* FIXED: Centered Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SL No.
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Exam Title
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
                {(userData.role === "Faculty" || userData.role === "Admin") && (
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.exams.map((exam, index) => {
                const examCreator = isExamCreator(exam);
                
                return (
                  <tr key={exam._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                      {(state.currentPage - 1) * state.limit + index + 1}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {exam.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <div className="font-medium">
                        {new Date(exam.startTime).toLocaleDateString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(exam.startTime).toLocaleTimeString("en-IN", { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      <div className="font-medium">
                        {new Date(exam.endTime).toLocaleDateString("en-IN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(exam.endTime).toLocaleTimeString("en-IN", { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {userData.role === "Student" && (
                        <button
                          onClick={() => handleStartExam(exam._id)}
                          className="inline-flex items-center px-4 py-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <PenTool className="h-5 w-5 mr-1" />
                          Start Exam
                        </button>
                      )}
                      
                      {examCreator && (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditExam(exam._id)}
                            className="inline-flex items-center px-3 py-2 cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => navigate(`/${userData.role.toLowerCase()}-dashboard/exams/${exam._id}/questions`)}
                            className="inline-flex items-center px-3 py-2 cursor-pointer bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <PenTool className="h-3 w-3 mr-1" />
                            Questions
                          </button>
                          
                          <button
                            onClick={() => handleDeleteExam(exam._id)}
                            className="inline-flex items-center px-3 py-2 cursor-pointer bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      )}
                      
                      {userData.role === "Admin" && !examCreator && (
                        <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg">
                          View Only
                        </span>
                      )}
                    </td>
                    
                    {(userData.role === "Faculty" || userData.role === "Admin") && (
                      <td className="px-6 py-4 text-center">
                        {exam.status === "draft" && (examCreator || userData.role === 'Admin') && (
                          <button
                            onClick={() => handlePublishExam(exam._id)}
                            className="inline-flex items-center px-3 py-2 cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Publish
                          </button>
                        )}
                        
                        {exam.status === "published" && (examCreator || userData.role === 'Admin') && (
                          <button
                            onClick={() => handleUnpublishExam(exam._id)}
                            className="inline-flex items-center px-3 py-2 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Unpublish
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIXED: Working Pagination at Bottom */}
      {state.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border mt-6 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            {/* Pagination Info */}
            <div className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-semibold">
                {(state.currentPage - 1) * state.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold">
                {Math.min(state.currentPage * state.limit, state.exams.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold">{state.exams.length}</span> results
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={state.currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(state.currentPage - 1)}
                disabled={state.currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === state.currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(state.currentPage + 1)}
                disabled={state.currentPage === state.totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(state.totalPages)}
                disabled={state.currentPage === state.totalPages}
                className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {state.exams.length === 0 && !state.isLoading && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exams found</h3>
            <p className="text-gray-600 mb-4">
              {searchInput 
                ? `No exams match your search for "${searchInput}"` 
                : 'There are no exams available at the moment.'}
            </p>
            {searchInput && (
              <button
                onClick={clearSearch}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamList;
