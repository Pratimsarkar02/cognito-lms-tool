import { useContext, useEffect, useState } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../../components/dashboard/LoadingSkeleton';

const ExamResults = () => {
  const { authState: { userData }, backendUrl } = useContext(AppContent);
  const [state, setState] = useState({
    results: [],
    isLoading: true,
    error: null,
    filter: '',
  });
  
  // Get current user role
  const userRole = userData?.role || 'Student';

  const fetchResults = async () => {
    try {
      if (userRole === 'Student') {
        // For students: Get their own results across all exams
        await fetchStudentResults();
      } else {
        // For faculty/admin: Get results they might need to see
        await fetchResultsAsStaff();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Failed to load results',
        isLoading: false
      }));
      toast.error('Failed to load exam results');
    }
  };

  // Function to fetch results for students
  const fetchStudentResults = async () => {
    try {
      // First get the list of exams this student has attempted
      const examsResponse = await axios.get(`${backendUrl}/api/exams/attempted`, {
        withCredentials: true
      });
      
      if (!examsResponse.data.exams || examsResponse.data.exams.length === 0) {
        setState(prev => ({
          ...prev,
          results: [],
          isLoading: false,
          error: null
        }));
        return;
      }

      // Now fetch results for each exam
      const examIds = examsResponse.data.exams.map(exam => exam._id);
      const resultsPromises = examIds.map(examId => 
        axios.get(`${backendUrl}/api/results/${examId}`, {
          withCredentials: true
        })
      );

      const resultsResponses = await Promise.allSettled(resultsPromises);
      
      // Extract successful results
      const allResults = resultsResponses
        .filter(response => response.status === 'fulfilled')
        .flatMap(response => response.value.data.results || []);
      
      setState(prev => ({
        ...prev,
        results: allResults,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.log(error)
    }
  };

  // Function to fetch results for faculty/admin
  const fetchResultsAsStaff = async () => {
    try {
      // For simplicity, we'll get all exams first
      const examsResponse = await axios.get(`${backendUrl}/api/exams/all`, {
        withCredentials: true
      });
      
      if (!examsResponse.data.exams || examsResponse.data.exams.length === 0) {
        setState(prev => ({
          ...prev,
          results: [],
          isLoading: false,
          error: null
        }));
        return;
      }

      // Now fetch results for each exam
      const examIds = examsResponse.data.exams.map(exam => exam._id);
      const resultsPromises = examIds.map(examId => 
        axios.get(`${backendUrl}/api/results/${examId}`, {
          withCredentials: true
        })
      );

      const resultsResponses = await Promise.allSettled(resultsPromises);
      
      // Extract successful results
      const allResults = resultsResponses
        .filter(response => response.status === 'fulfilled')
        .flatMap(response => response.value.data.results || []);
      
      setState(prev => ({
        ...prev,
        results: allResults,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [userRole]);

  const filteredResults = state.results.filter(result => {
    // Make sure we have a title to filter by
    const examTitle = result.examId?.title || '';
    console.log("Exam TItle:", examTitle)
    return examTitle.toLowerCase().includes(state.filter.toLowerCase());
  });
  if (state.isLoading) return <TableSkeleton />;
  if (state.error) return <div className="text-red-600 p-6">{state.error}</div>;
  
  // Check if we have any results
  if (state.results.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Exam Results</h2>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">
            {userRole === 'Student' 
              ? "No exam results found. You haven't taken any exams yet."
              : "No exam results found. No students have taken exams yet."}
          </p>
        </div>
      </div>
    );
  }

  // Calculate performance metrics
  const totalExams = state.results.length;
  const passedExams = state.results.filter(r => r.isPassed).length;
  const averagePercentage = totalExams > 0 
    ? (state.results.reduce((sum, result) => sum + (result.percentage || 0), 0) / totalExams).toFixed(2)
    : 0;
  const passRate = totalExams > 0 
    ? ((passedExams / totalExams) * 100).toFixed(2)
    : 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Exam Results</h2>
        <input
          type="text"
          placeholder="Search exams..."
          className="p-2 border rounded w-64"
          onChange={(e) => setState(prev => ({...prev, filter: e.target.value}))}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Exam Title</th>
              {userRole !== 'Student' && (
                <th className="px-6 py-3 text-left text-sm font-medium">Student</th>
              )}
              <th className="px-6 py-3 text-right text-sm font-medium">Marks Obtained</th>
              <th className="px-6 py-3 text-right text-sm font-medium">Total Marks</th>
              <th className="px-6 py-3 text-right text-sm font-medium">Percentage</th>
              <th className="px-6 py-3 text-right text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredResults.map((result) => (
              <tr key={result._id}>
                <td className="px-6 py-4 text-sm">
                  <div className="font-medium">{result.examId?.title}</div>
                  <div className="text-gray-500">
                    {result.bestAttemptId?.startTime && 
                     new Date(result.bestAttemptId.startTime).toLocaleDateString()}
                  </div>
                </td>
                {userRole !== 'Student' && (
                  <td className="px-6 py-4 text-sm">
                    {result.studentId?.firstName} {result.studentId?.lastName}
                  </td>
                )}
                <td className="px-6 py-4 text-right text-sm">
                  {result.marksObtained?.toFixed(2) || 0}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  {result.totalMarks || 0}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <span className={`px-2 py-1 rounded ${(result.percentage || 0) >= 40 ? 
                    'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {(result.percentage || 0).toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  {result.isPassed ? (
                    <span className="text-green-600">Passed</span>
                  ) : (
                    <span className="text-red-600">Failed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredResults.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No results found matching your search criteria
          </div>
        )}
      </div>

      {/* Performance Summary Card - Only show for students */}
      {userRole === 'Student' && (
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Exams Attempted:</span>
                <span className="font-medium">{totalExams}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Percentage:</span>
                <span className="font-medium">{averagePercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span>Pass Rate:</span>
                <span className="font-medium">{passRate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Stats for Faculty/Admin */}
      {userRole !== 'Student' && (
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Results:</span>
                <span className="font-medium">{totalExams}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Score:</span>
                <span className="font-medium">{averagePercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span>Pass Rate:</span>
                <span className="font-medium">{passRate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResults;