// AdminResults.jsx — same structure as FacultyResults but system-wide
import { useCallback, useContext, useEffect, useState } from 'react';
import { AppContent } from '../../../contexts/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../../../components/dashboard/LoadingSkeleton';
import {
  ChevronLeft, Search, X, Users, BarChart2, CheckCircle, XCircle,
  Download, ClipboardList, UserCog, Filter, Play, Eye, EyeOff, RefreshCw
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    pending:   { label: 'Pending',   cls: 'bg-gray-100 text-gray-500' },
    generated: { label: 'Generated', cls: 'bg-yellow-100 text-yellow-700' },
    published: { label: 'Published', cls: 'bg-green-100 text-green-700' },
  };
  const s = map[status] || map.pending;
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
};

const AdminExamResults = ({ exam, onBack, backendUrl }) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${backendUrl}/api/results/${exam._id}`, { withCredentials: true })
      .then(({ data }) => { if (data.success) setResults(data.results || []); })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setIsLoading(false));
  }, [exam._id, backendUrl]);

  const filtered = results.filter(r => {
    const name = `${r.studentId?.firstName} ${r.studentId?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (r.studentId?.email || '').toLowerCase().includes(search.toLowerCase());
  });

  const passed = results.filter(r => r.isPassed).length;
  const avg = results.length > 0 ? (results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length).toFixed(1) : 0;

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-xl font-bold text-gray-800 truncate">{exam.title}</h1>
        <StatusBadge status={exam.resultsStatus} />
      </div>

      {/* Creator Info Card */}
      {exam.createdBy && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg"><UserCog className="w-5 h-5 text-blue-700" /></div>
          <div>
            <p className="text-xs text-blue-500 font-medium uppercase tracking-wider">Created By</p>
            <p className="font-semibold text-blue-900">{exam.createdBy.firstName} {exam.createdBy.lastName}</p>
            <p className="text-sm text-blue-600">{exam.createdBy.role}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-blue-500">Total Marks</p>
            <p className="font-bold text-blue-900 text-lg">{exam.totalMarks}</p>
          </div>
        </div>
      )}

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
        {exam.resultsStatus !== 'pending' && (
          <button onClick={() => window.open(`${backendUrl}/api/results/${exam._id}/export`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
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
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${['Score','Percentage','Status'].includes(h) ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((result, i) => (
                  <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{result.studentId?.firstName} {result.studentId?.lastName}</td>
                    <td className="px-4 py-3 text-gray-500">{result.studentId?.email || '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold">{result.marksObtained ?? 0} / {result.totalMarks ?? 0}</td>
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

const AdminResults = () => {
  const { authState: { userData }, backendUrl } = useContext(AppContent);
  const [exams, setExams] = useState([]);
  const [examStats, setExamStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);

  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/exams/all`, { withCredentials: true, params: { limit: 200 } });
      const fetchedExams = data.exams || [];
      setExams(fetchedExams);

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
    } catch { toast.error('Failed to load exams'); }
    finally { setIsLoading(false); }
  }, [backendUrl]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const handleAction = async (exam, action, e) => {
    e.stopPropagation();
    const messages = {
      generate: `Generate results for "${exam.title}"?`,
      publish: `Publish results for "${exam.title}"? Students will see their scores.`,
      unpublish: `Unpublish results for "${exam.title}"?`,
    };
    if (!window.confirm(messages[action])) return;
    setActionLoading(prev => ({ ...prev, [exam._id]: true }));
    try {
      const method = action === 'generate' ? 'post' : 'patch';
      const { data } = await axios[method](`${backendUrl}/api/results/${exam._id}/${action}`, {}, { withCredentials: true });
      toast.success(data.message);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} results`);
    } finally {
      setActionLoading(prev => ({ ...prev, [exam._id]: false }));
    }
  };

  if (selectedExam) return <AdminExamResults exam={selectedExam} onBack={() => { setSelectedExam(null); fetchExams(); }} backendUrl={backendUrl} />;

  const creators = [...new Map(exams.filter(e => e.createdBy).map(e => [e.createdBy._id, e.createdBy])).values()];
  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) &&
    (creatorFilter === '' || e.createdBy?._id === creatorFilter)
  );

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Results — All Exams</h1>
        <p className="text-sm text-gray-500 mt-1">Manage result generation and publication for all exams</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search exam name..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={creatorFilter} onChange={e => setCreatorFilter(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All Creators</option>
            {creators.map(c => <option key={c._id} value={c._id}>{c.firstName} {c.lastName} ({c.role})</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No exams found.</p>
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
                  <div className={`p-2 rounded-lg ${canView ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                    <ClipboardList className={`w-5 h-5 ${canView ? 'text-indigo-600' : 'text-gray-400'}`} />
                  </div>
                  <StatusBadge status={exam.resultsStatus} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{exam.title}</h3>
                {exam.createdBy && (
                  <p className="text-xs text-indigo-600 font-medium mb-3">
                    By {exam.createdBy.firstName} {exam.createdBy.lastName}
                    <span className="text-gray-400 font-normal"> · {exam.createdBy.role}</span>
                  </p>
                )}
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
                    <p className="text-xs text-gray-400 text-center">Results not generated</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  {exam.resultsStatus === 'pending' && (
                    <button onClick={e => handleAction(exam, 'generate', e)} disabled={isActing}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {isActing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Generate
                    </button>
                  )}
                  {exam.resultsStatus === 'generated' && (
                    <button onClick={e => handleAction(exam, 'publish', e)} disabled={isActing}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {isActing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} Publish
                    </button>
                  )}
                  {exam.resultsStatus === 'published' && (
                    <button onClick={e => handleAction(exam, 'unpublish', e)} disabled={isActing}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors">
                      {isActing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />} Unpublish
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

export default AdminResults;