import PropTypes from "prop-types";
import { BellRing, Sparkles } from "lucide-react";

const NotificationSectionHeader = ({
  title = "Notifications",
  subtitle,
}) => {
  return (
    <div className="overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 px-5 py-5 text-white shadow-lg sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Live feed
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <BellRing className="h-5 w-5 text-cyan-100" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-200">
                {subtitle ||
                  "Stay updated with announcements, events, reminders, and academic alerts in one scrollable feed."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-100 backdrop-blur-sm">
          Real-time updates for your role
        </div>
      </div>
    </div>
  );
};

NotificationSectionHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

export default NotificationSectionHeader;