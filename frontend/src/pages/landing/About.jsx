import { GraduationCap, Heart, Rocket, Target } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const coreValues = [
  {
    icon: Rocket,
    title: "Innovation",
    description:
      "Continuously improving how learning, exams, and academic coordination work together.",
    accent: "text-cyan-700 bg-cyan-100",
  },
  {
    icon: Heart,
    title: "Empathy",
    description:
      "Designed around the real needs of students, faculty, and academic staff.",
    accent: "text-rose-700 bg-rose-100",
  },
  {
    icon: Target,
    title: "Excellence",
    description:
      "Maintaining reliability and clarity across every academic workflow we support.",
    accent: "text-emerald-700 bg-emerald-100",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-950 pt-[76px] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_30%)]" />

        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <GraduationCap className="h-4 w-4" />
            About Cognito
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Building a more connected academic experience.
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Cognito brings learning, exams, and academic communication into one
            focused platform, so students and faculty spend less time switching
            tools and more time on what matters.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-2xl font-bold text-slate-950">Our Mission</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              To simplify academic life by unifying course access, exam workflows,
              and communication into one clear, dependable experience for every
              role on campus.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8">
            <h2 className="text-2xl font-bold text-slate-950">Our Vision</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              A campus environment where learning tools, academic updates, and
              coordination work seamlessly together, supporting students and
              faculty without unnecessary friction.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Our core values
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              These principles guide how Cognito is designed, built, and improved
              over time.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {coreValues.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${value.accent}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-slate-900">
                    {value.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;