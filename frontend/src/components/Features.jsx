import {
  BellRing,
  BookOpenCheck,
  ChartNoAxesCombined,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: BookOpenCheck,
    title: "Unified academic workspace",
    description:
      "Bring courses, study flow, exam access, and essential academic actions into one cleaner student experience.",
    accent: "text-cyan-700 bg-cyan-100",
    border: "border-cyan-100",
  },
  {
    icon: BellRing,
    title: "Real-time notifications",
    description:
      "Keep students and faculty aligned with announcements, reminders, events, and important academic updates in one feed.",
    accent: "text-amber-700 bg-amber-100",
    border: "border-amber-100",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Progress and performance",
    description:
      "Track activity, exam outcomes, and platform engagement with a structure that makes progress easier to follow.",
    accent: "text-emerald-700 bg-emerald-100",
    border: "border-emerald-100",
  },
  {
    icon: ShieldCheck,
    title: "Role-based control",
    description:
      "Support students, faculty, and admins with focused access, clearer workflows, and safer academic coordination.",
    accent: "text-violet-700 bg-violet-100",
    border: "border-violet-100",
  },
];

const Features = () => {
  return (
    <section className="bg-white px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Platform strengths
            </div>

            <h2 className="mt-5 max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Built for day-to-day campus workflows, not just static course pages.
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Cognito is designed to reduce friction across the academic journey,
            from learning and assessments to communication and coordination.
            Instead of switching between disconnected tools, users work in one
            focused environment.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className={`group rounded-[28px] border ${feature.border} bg-slate-50/70 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.accent} transition group-hover:scale-105`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;