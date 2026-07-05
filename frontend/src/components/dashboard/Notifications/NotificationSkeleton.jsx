const NotificationSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="h-4 w-40 rounded-full bg-slate-200" />
              <div className="mt-2 h-3 w-28 rounded-full bg-slate-100" />
            </div>

            <div className="h-9 w-9 rounded-full bg-slate-100" />
          </div>

          <div className="mt-5 h-5 w-2/3 rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-11/12 rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-8/12 rounded-full bg-slate-100" />

          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-100">
            <div className="h-56 w-full bg-slate-100" />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex gap-2">
              <div className="h-10 w-24 rounded-full bg-slate-100" />
              <div className="h-10 w-24 rounded-full bg-slate-100" />
            </div>
            <div className="h-10 w-28 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSkeleton;