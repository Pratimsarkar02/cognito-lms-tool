// FacultyResults.jsx
import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../../components/dashboard/LoadingSkeleton';
import {
  ChevronLeft, Search, X, Users, BarChart2,
  CheckCircle, XCircle, Download, ClipboardList,
  Play, Eye, EyeOff, RefreshCw
} from 'lucide-react';

// ── Status badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending:   { label: 'Pending',   cls: 'bg-gray-100 text-gray-500' },
    generated: { label: 'Generated', cls: 'bg-yellow-100 text-yellow-700' },
    published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
  };
  const s = map[status] || map.pending;
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
};

// ── Level 2: Student results table ─────────────────────────────────────────
const ExamStudentResults = ({ exam, onBack, backendUrl }) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${backendUrl}/api/results/${exam._id}`, { withCredentials: true })
      .then(({ data }) => { if (data.success) setResults(data.results || []); })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setIsLoading(false));
  }, [exam._id, backendUrl]);

  const handleExport = () => window.open(`${backendUrl}/api/results/${exam._id}/export`, '_blank');

  const filtered = results.filter(r => {
    const name = `${r.studentId?.firstName} ${r.studentId?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (r.studentId?.email || '').toLowerCase().includes(search.toLowerCase());
  });

  const passed = results.filter(r => r.isPassed).length;
  const avg = results.length > 0
    ? (results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length).toFixed(1) : 0;

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Exams
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-xl font-bold text-gray-800 truncate">{exam.title}</h1>
        <StatusBadge status={exam.resultsStatus} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Attempts', value: results.length, icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Passed', value: `${passed} / ${results.length}`, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Class Average', value: `${avg}%`, icon: <BarChart2 className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
            <div className={`p-3 ${bg} rounded-lg`}>{icon}</div>
            <div><p className="text-xs text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        {exam.resultsStatus === 'published' && (
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">{search ? `No students match "${search}"` : 'No students have completed this exam yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Sl.', 'Student', 'Email', 'Score', 'Percentage', 'Attempted On', 'Status'].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${['Score', 'Percentage', 'Status'].includes(h) ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((result, i) => (
                  <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{result.studentId?.firstName} {result.studentId?.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{result.studentId?.email || '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{result.marksObtained ?? 0} / {result.totalMarks ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${result.percentage >= 60 ? 'text-green-600' : result.percentage >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {result.percentage?.toFixed(1) ?? 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {result.bestAttemptId?.startTime ? new Date(result.bestAttemptId.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {result.isPassed
                        ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Passed</span>
                        : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Failed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Level 1: Faculty exam list with lifecycle actions ───────────────────────
const FacultyResults = () => {
  const { authState: { userData }, backendUrl } = useContext(AppContent);
  const [exams, setExams] = useState([]);
  const [examStats, setExamStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});  // { examId: true/false }
  const [search, setSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/exams/my-exams`, {
        withCredentials: true, params: { creatorId: userData?._id, limit: 100 }
      });
      const fetchedExams = data.exams || [];
      setExams(fetchedExams);

      // Fetch result stats only for non-pending exams
      const statsArr = await Promise.allSettled(
        fetchedExams.map(exam =>
          exam.resultsStatus !== 'pending'
            ? axios.get(`${backendUrl}/api/results/${exam._id}`, { withCredentials: true })
            : Promise.resolve({ data: { results: [] } })
        )
      );
      const statsMap = {};
      statsArr.forEach((res, i) => {
        const r = res.status === 'fulfilled' ? (res.value.data.results || []) : [];
        const passed = r.filter(x => x.isPassed).length;
        const avg = r.length > 0 ? (r.reduce((s, x) => s + (x.percentage || 0), 0) / r.length).toFixed(1) : 0;
        statsMap[fetchedExams[i]._id] = { total: r.length, passed, avg };
      });
      setExamStats(statsMap);
    } catch {
      toast.error('Failed to load your exams');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, userData]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleGenerate = async (exam, e) => {
    e.stopPropagation();
    if (!window.confirm(`Generate results for "${exam.title}"? This will compute scores for all completed attempts.`)) return;
    setActionLoading(prev => ({ ...prev, [exam._id]: true }));
    try {
      const { data } = await axios.post(`${backendUrl}/api/results/${exam._id}/generate`, {}, { withCredentials: true });
      toast.success(data.message);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate results');
    } finally {
      setActionLoading(prev => ({ ...prev, [exam._id]: false }));
    }
  };

  const handlePublish = async (exam, e) => {
    e.stopPropagation();
    if (!window.confirm(`Publish results for "${exam.title}"? Students will be able to see their scores.`)) return;
    setActionLoading(prev => ({ ...prev, [exam._id]: true }));
    try {
      const { data } = await axios.patch(`${backendUrl}/api/results/${exam._id}/publish`, {}, { withCredentials: true });
      toast.success(data.message);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish results');
    } finally {
      setActionLoading(prev => ({ ...prev, [exam._id]: false }));
    }
  };

  const handleUnpublish = async (exam, e) => {
    e.stopPropagation();
    if (!window.confirm(`Unpublish results for "${exam.title}"? Students will no longer see their scores.`)) return;
    setActionLoading(prev => ({ ...prev, [exam._id]: true }));
    try {
      const { data } = await axios.patch(`${backendUrl}/api/results/${exam._id}/unpublish`, {}, { withCredentials: true });
      toast.success(data.message);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unpublish results');
    } finally {
      setActionLoading(prev => ({ ...prev, [exam._id]: false }));
    }
  };

  if (selectedExam) return <ExamStudentResults exam={selectedExam} onBack={() => { setSelectedExam(null); fetchExams(); }} backendUrl={backendUrl} />;

  const filtered = exams.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Results — My Exams</h1>
        <p className="text-sm text-gray-500 mt-1">Generate, review, and publish results for your exams</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search exam name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">{search ? `No exams match "${search}"` : "You haven't created any exams yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exam => {
            const stats = examStats[exam._id] || { total: 0, passed: 0, avg: 0 };
            const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(0) : 0;
            const isActing = actionLoading[exam._id];
            const canView = exam.resultsStatus !== 'pending';

            return (
              <div key={exam._id}
                onClick={() => canView && setSelectedExam(exam)}
                className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-all ${canView ? 'hover:shadow-md hover:border-blue-300 cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${canView ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <ClipboardList className={`w-5 h-5 ${canView ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <StatusBadge status={exam.resultsStatus} />
                </div>

                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{exam.title}</h3>
                <p className="text-xs text-gray-400 mb-4">
                  {new Date(exam.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>

                {/* Stats — only when results exist */}
                {canView ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 mb-3">
                      <div className="text-center"><p className="text-lg font-bold text-gray-800">{stats.total}</p><p className="text-xs text-gray-400">Attempts</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-green-600">{stats.passed}</p><p className="text-xs text-gray-400">Passed</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-purple-600">{stats.avg}%</p><p className="text-xs text-gray-400">Avg</p></div>
                    </div>
                    {stats.total > 0 && (
                      <div className="mb-3">
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${passRate}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{passRate}% pass rate</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="pt-3 border-t border-gray-100 mb-3">
                    <p className="text-xs text-gray-400 text-center">No results generated yet</p>
                  </div>
                )}

                {/* Action buttons — stop propagation so clicking button doesn't open drill-down */}
                <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  {exam.resultsStatus === 'pending' && (
                    <button onClick={e => handleGenerate(exam, e)} disabled={isActing}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {isActing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Generate Results
                    </button>
                  )}
                  {exam.resultsStatus === 'generated' && (
                    <button onClick={e => handlePublish(exam, e)} disabled={isActing}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {isActing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                      Publish Results
                    </button>
                  )}
                  {exam.resultsStatus === 'published' && (
                    <button onClick={e => handleUnpublish(exam, e)} disabled={isActing}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors">
                      {isActing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />}
                      Unpublish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FacultyResults;