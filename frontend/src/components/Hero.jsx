import { ArrowRight, BookOpen, CalendarCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-28 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl gap-12 px-6 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <Sparkles className="h-4 w-4" />
            Smarter academic workflow
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            One platform for learning, exams, updates, and campus coordination.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Cognito LMS brings course access, academic notifications, exam workflows,
            and student coordination into a single focused experience for your college.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore platform
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Course flow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Learn, manage resources, and stay organized in one place.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Exam ready</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Attempt exams, track timing, and review performance smoothly.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">Role-aware</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Students, faculty, and admins each get focused workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-10 hidden h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl lg:block" />
          <div className="absolute -bottom-10 right-0 hidden h-40 w-40 rounded-full bg-blue-500/20 blur-3xl lg:block" />

          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm">
            <div className="overflow-hidden rounded-[26px] border border-white/10 bg-slate-900">
              <img
                src="./src/assets/hero-pg-photo.png"
                alt="Students collaborating with books and study materials"
                className="h-[520px] w-full object-cover"
              />
            </div>

            <div className="absolute left-8 top-8 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">
                Built for campus life
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Learning, assessments, and updates connected.
              </p>
            </div>

            <div className="absolute bottom-8 right-8 rounded-2xl border border-white/10 bg-white px-4 py-3 text-slate-900 shadow-lg">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Student-first
              </p>
              <p className="mt-2 text-sm font-semibold">
                Stay informed without switching tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;