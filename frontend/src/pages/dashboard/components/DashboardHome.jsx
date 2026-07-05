import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BellRing, CalendarRange, ClipboardList, Sparkles } from "lucide-react";
import { AppContent } from "../../../contexts/AppContext";
import { CardSkeleton } from "../../../components/dashboard/LoadingSkeleton";
import ExamCard from "../../../components/dashboard/ExamCard";
import NotificationFeed from "../../../components/dashboard/Notifications/NotificationFeed";

const DashboardHome = () => {
  const {
    authState: { userData },
    backendUrl,
  } = useContext(AppContent);

  const [state, setState] = useState({
    exams: [],
    isLoading: true,
    currentPage: 1,
    totalPages: 1,
    sortBy: "-createdAt",
    searchQuery: "",
    limit: 6,
  });

  const fetchExams = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      let endpoint = "/api/exams/active";
      const params = {
        page: state.currentPage,
        limit: state.limit,
        sortBy: state.sortBy,
        search: state.searchQuery,
      };

      if (userData.role === "Faculty") {
        endpoint = "/api/exams/my-exams";
        params.creatorId = userData._id;
      }

      if (userData.role === "Admin") {
        endpoint = "/api/exams/all";
      }

      const { data } = await axios.get(`${backendUrl}${endpoint}`, {
        params,
        withCredentials: true,
      });

      setState((prev) => ({
        ...prev,
        exams: data.exams || [],
        totalPages: data.pagination?.totalPages || 1,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Fetch Error:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to fetch exams");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [
    backendUrl,
    state.currentPage,
    state.sortBy,
    state.searchQuery,
    state.limit,
    userData,
  ]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const stats = useMemo(() => {
    const total = state.exams.length;
    const published = state.exams.filter((exam) => exam.isPublished).length;
    const upcoming = state.exams.filter((exam) => {
      if (!exam.startTime) return false;
      return new Date(exam.startTime) > new Date();
    }).length;

    return { total, published, upcoming };
  }, [state.exams]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 px-5 py-6 text-white shadow-xl sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              <Sparkles size={14} />
              Dashboard overview
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
              Welcome back, {userData?.firstName || "User"}.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Track your latest exam activity and stay updated with announcements,
              reminders, and events from your academic feed in one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-cyan-100">
                <ClipboardList size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Total exams
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold">{stats.total}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-emerald-100">
                <BellRing size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Published
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold">{stats.published}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 text-amber-100">
                <CalendarRange size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Upcoming
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold">{stats.upcoming}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="space-y-5">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Exam overview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your most relevant exam cards are shown here for quick access.
                </p>
              </div>

              <div className="inline-flex rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setState((prev) => ({ ...prev, sortBy: "-createdAt" }))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    state.sortBy === "-createdAt"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setState((prev) => ({ ...prev, sortBy: "title" }))
                  }
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    state.sortBy === "title"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  A-Z
                </button>
              </div>
            </div>

            <div className="mt-4">
              <input
                type="text"
                placeholder="Search exams by title..."
                value={state.searchQuery}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    currentPage: 1,
                    searchQuery: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            {state.isLoading ? (
              <CardSkeleton count={3} />
            ) : state.exams.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {state.exams.map((exam) => (
                  <ExamCard key={exam._id} exam={exam} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                <h3 className="text-lg font-semibold text-slate-800">
                  No exams found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search term or check again later.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <NotificationFeed />
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;