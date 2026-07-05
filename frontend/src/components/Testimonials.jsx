import TestimonialCard from "./TestimonialCard";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Undergraduate Student",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80",
    content:
      "I like that course access, exam flow, and key updates are in one place. It saves time and makes day-to-day academic work feel much more manageable.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Faculty Member",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80",
    content:
      "The platform helps simplify communication with students and keeps important academic updates easier to publish and follow.",
    rating: 4,
  },
  {
    name: "Emily Davis",
    role: "Student Representative",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80",
    content:
      "What stands out most is how organized the experience feels. Notifications, learning flow, and exam-related work no longer feel disconnected.",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Department Coordinator",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80",
    content:
      "Even simple things like sharing updates and keeping learners informed become easier when the platform is structured around actual campus needs.",
    rating: 4,
  },
  {
    name: "Lisa Thompson",
    role: "Postgraduate Student",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80",
    content:
      "The interface feels much clearer than juggling different tools. I can focus more on work and less on figuring out where things are.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Teaching Assistant",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80",
    content:
      "It gives us a better way to stay aligned with students, especially when exams, reminders, and day-to-day updates all matter at once.",
    rating: 4,
  },
];

const Testimonials = () => {
  return (
    <section className="bg-slate-50 px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Social proof
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Built around how students and faculty actually work.
            </h2>
          </div>

          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Strong academic tools are not only about features. They also need to
            feel clear, reliable, and easy to use across everyday campus activity.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={`${testimonial.name}-${testimonial.role}`} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;