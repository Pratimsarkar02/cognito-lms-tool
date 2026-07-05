import { BellRing, CalendarDays, Sparkles } from "lucide-react";

const NotificationEmptyState = () => {
  return (
    <div className="overflow-hidden rounded-[28px] border border-dashed border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50/60 px-6 py-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
        <BellRing className="h-7 w-7 text-cyan-600" />
      </div>

      <h3 className="mt-5 text-xl font-semibold text-slate-900">
        No notifications yet
      </h3>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        When announcements, reminders, or event updates are published for your role,
        they will appear here in a live social-style feed.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Feed updates
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
          <CalendarDays className="h-4 w-4 text-violet-500" />
          Events and reminders
        </div>
      </div>
    </div>
  );
};

export default NotificationEmptyState;