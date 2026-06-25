// ExamResults.jsx — complete rewrite
// Unified results page for all three roles.
//
// STUDENT:  Single call GET /api/results/all → published results only.
//           Calls GET /api/exams/attempted → shows "Awaiting Results" for unscored exams.
//
// FACULTY:  GET /api/results/all → their own exams (generated+published).
//           GET /api/exams/my-exams → includes exams with 0 results yet.
//           Has Generate / Publish / Unpublish buttons per exam.
//
// ADMIN:    GET /api/results/all → all exams (generated+published).
//           GET /api/exams/all → includes pending exams too.
//           Has Publish / Unpublish buttons.

import { useContext, useEffect, useState, useCallback } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../../components/dashboard/LoadingSkeleton';

const ExamResults = () => {
  const { authState: { userData }, backendUrl } = useContext(AppContent);
  const userRole = userData?.role || 'Student';

  const [results, setResults] = useState([]);
  const [examStatuses, setExamStatuses] = useState({});    // { [examId]: 'pending'|'generated'|'published' }
  const [examList, setExamList] = useState([]);            // for showing exams with 0 results
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});  // { [examId]: bool }
  const [filter, setFilter] = useState('');

  // ── FETCH ─────────────────────────────────────────────────────────────────

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[ExamResults] fetchResults role=', userRole);

      if (userRole === 'Student') {
        // Parallel: attempted exams list + published results
        const [attemptsRes, resultsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/exams/attempted`, { withCredentials: true }),
          axios.get(`${backendUrl}/api/results/all`, { withCredentials: true }),
        ]);

        const attempted = attemptsRes.data.exams || [];
        const fetchedResults = resultsRes.data.results || [];
        console.log('[ExamResults] Student: attempted=', attempted.length, 'results=', fetchedResults.length);

        setExamList(attempted);
        setResults(fetchedResults);

      } else {
        // Faculty or Admin: parallel fetch of results + exam list
        const examsEndpoint = userRole === 'Faculty' ? '/api/exams/my-exams' : '/api/exams/all';

        const [resultsRes, examsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/results/all`, { withCredentials: true }),
          axios.get(`${backendUrl}${examsEndpoint}`, { withCredentials: true }),
        ]);

        const fetchedResults = resultsRes.data.results || [];
        const fetchedExams = examsRes.data.exams || [];
        console.log('[ExamResults] Staff: results=', fetchedResults.length, 'exams=', fetchedExams.length);

        // Build status map — seed from exam list first, then override with result data
        const statusMap = {};
        for (const e of fetchedExams) {
          statusMap[e._id] = e.resultsStatus || 'pending';
        }
        for (const r of fetchedResults) {
          if (r.examId?._id && r.examId?.resultsStatus) {
            statusMap[r.examId._id] = r.examId.resultsStatus;
          }
        }

        setResults(fetchedResults);
        setExamList(fetchedExams);
        setExamStatuses(statusMap);
      }
    } catch (error) {
      console.error('[ExamResults] fetch error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  }, [userRole, backendUrl]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // ── ACTIONS ───────────────────────────────────────────────────────────────

  const handleGenerate = async (examId) => {
    setActionLoading(prev => ({ ...prev, [examId]: true }));
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/results/${examId}/generate`, {}, { withCredentials: true }
      );
      if (data.success) { toast.success(data.message); await fetchResults(); }
      else toast.error(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate results');
    } finally {
      setActionLoading(prev => ({ ...prev, [examId]: false }));
    }
  };

  const handlePublish = async (examId) => {
    setActionLoading(prev => ({ ...prev, [examId]: true }));
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/results/${examId}/publish`, {}, { withCredentials: true }
      );
      if (data.success) { toast.success(data.message); await fetchResults(); }
      else toast.error(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish results');
    } finally {
      setActionLoading(prev => ({ ...prev, [examId]: false }));
    }
  };

  const handleUnpublish = async (examId) => {
    setActionLoading(prev => ({ ...prev, [examId]: true }));
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/results/${examId}/unpublish`, {}, { withCredentials: true }
      );
      if (data.success) { toast.success(data.message); await fetchResults(); }
      else toast.error(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unpublish results');
    } finally {
      setActionLoading(prev => ({ ...prev, [examId]: false }));
    }
  };

  // ── HELPERS ───────────────────────────────────────────────────────────────

  // Filter by exam title — applies to both result rows and exam-header cards
  const filteredResults = results.filter(r =>
    (r.examId?.title || '').toLowerCase().includes(filter.toLowerCase())
  );

  const filteredExamList = examList.filter(e =>
    (e.title || '').toLowerCase().includes(filter.toLowerCase())
  );

  const StatusBadge = ({ status }) => {
    const map = {
      pending:   { cls: 'bg-gray-100 text-gray-600',    label: 'Pending' },
      generated: { cls: 'bg-yellow-100 text-yellow-800', label: 'Generated (Not Published)' },
      published: { cls: 'bg-green-100 text-green-700',   label: 'Published' },
    };
    const { cls, label } = map[status] || map.pending;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
  };

  const ActionButtons = ({ examId }) => {
    const status = examStatuses[examId] || 'pending';
    const loading = actionLoading[examId];
    return (
      <div className="flex gap-2 flex-wrap">
        {status === 'pending' && (
          <button onClick={() => handleGenerate(examId)} disabled={loading}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer">
            {loading ? 'Generating…' : 'Generate Results'}
          </button>
        )}
        {status === 'generated' && (
          <>
            <button onClick={() => handlePublish(examId)} disabled={loading}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition cursor-pointer">
              {loading ? 'Publishing…' : 'Publish'}
            </button>
            <button onClick={() => handleGenerate(examId)} disabled={loading}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition cursor-pointer">
              Re-generate
            </button>
          </>
        )}
        {status === 'published' && (
          <button onClick={() => handleUnpublish(examId)} disabled={loading}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition cursor-pointer">
            {loading ? 'Unpublishing…' : 'Unpublish'}
          </button>
        )}
      </div>
    );
  };

  // ── STUDENT VIEW ──────────────────────────────────────────────────────────

  const StudentView = () => {
    const publishedExamIds = new Set(filteredResults.map(r => r.examId?._id?.toString()));
    const awaitingExams = filteredExamList.filter(e => !publishedExamIds.has(e._id?.toString()));

    return (
      <div className="space-y-6">
        {awaitingExams.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Awaiting Results</h3>
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {awaitingExams.map(exam => (
                <div key={exam._id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-gray-800">{exam.title}</span>
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">⏳ Awaiting Results</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredResults.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Scores</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Exam Title</th>
                    <th className="text-left px-4 py-3">Marks Obtained</th>
                    <th className="text-left px-4 py-3">Percentage</th>
                    <th className="text-left px-4 py-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredResults.map(result => (
                    <tr key={result._id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{result.examId?.title || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {(result.marksObtained || 0).toFixed(1)} / {result.totalMarks || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${result.percentage >= 40 ? 'text-green-700' : 'text-red-600'}`}>
                          {(result.percentage || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${result.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {result.isPassed ? '✓ Passed' : '✗ Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredResults.length === 0 && awaitingExams.length === 0 && (
          <p className="text-center text-gray-400 py-16">You haven't taken any exams yet.</p>
        )}
      </div>
    );
  };

  // ── FACULTY / ADMIN VIEW ──────────────────────────────────────────────────

  const StaffView = () => {
    // Group results by exam
    const examMap = {};

    // Seed with all known exams (including ones with 0 results)
    for (const exam of filteredExamList) {
      if (!examMap[exam._id]) {
        examMap[exam._id] = { exam, results: [], status: examStatuses[exam._id] || exam.resultsStatus || 'pending' };
      }
    }

    // Add result rows into their exam group
    for (const r of filteredResults) {
      const eId = r.examId?._id;
      if (!eId) continue;
      if (!examMap[eId]) {
        examMap[eId] = { exam: r.examId, results: [], status: examStatuses[eId] || r.examId?.resultsStatus || 'pending' };
      }
      examMap[eId].results.push(r);
    }

    const groups = Object.values(examMap);

    if (groups.length === 0) {
      return <p className="text-center text-gray-400 py-16">No exams found.</p>;
    }

    return (
      <div className="space-y-5">
        {groups.map(({ exam, results: examResults, status }) => (
          <div key={exam._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Exam header row */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm">{exam.title}</span>
                <StatusBadge status={status} />
                <span className="text-xs text-gray-400">{examResults.length} student{examResults.length !== 1 ? 's' : ''}</span>
              </div>
              <ActionButtons examId={exam._id} />
            </div>

            {/* Results table */}
            {examResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2">Student</th>
                      <th className="text-left px-4 py-2">Email</th>
                      <th className="text-left px-4 py-2">Marks</th>
                      <th className="text-left px-4 py-2">Percentage</th>
                      <th className="text-left px-4 py-2">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {examResults.map(result => (
                      <tr key={result._id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {result.studentId?.firstName} {result.studentId?.lastName}
                        </td>
                        <td className="px-4 py-2 text-gray-400 text-xs">{result.studentId?.email || '—'}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {(result.marksObtained || 0).toFixed(1)} / {result.totalMarks || 0}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`font-semibold ${result.percentage >= (exam.passingPercentage || 40) ? 'text-green-700' : 'text-red-600'}`}>
                            {(result.percentage || 0).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${result.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {result.isPassed ? '✓ Pass' : '✗ Fail'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center px-4 py-5">
                {status === 'pending'
                  ? 'No results generated yet. Click "Generate Results" above.'
                  : 'No student results available.'}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {userRole === 'Student' ? 'My Results' : 'Exam Results Management'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {userRole === 'Student'
              ? 'View your exam results and scores'
              : userRole === 'Faculty'
              ? 'Generate, review and publish results for your exams'
              : 'Manage and publish results across all exams'}
          </p>
        </div>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search by exam title…"
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
      </div>

      {userRole === 'Student' ? <StudentView /> : <StaffView />}
    </div>
  );
};

export default ExamResults;