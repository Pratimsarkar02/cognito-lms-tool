import { useState } from "react";
import PropTypes from "prop-types";
import { MessageSquare, Send } from "lucide-react";
import { formatNotificationDate, getFullName } from "../../../utils/notificationHelpers";

const NotificationComments = ({ comments = [], onAddComment, disabled = false }) => {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">
          Comments ({comments.length})
        </span>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment._id} className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">
                {getFullName(comment.userId)}
              </p>
              <p className="text-xs text-slate-500">
                {formatNotificationDate(comment.createdAt)}
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-600">{comment.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={text}
          disabled={disabled || submitting}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none ring-0 focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={disabled || submitting || !text.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          Post
        </button>
      </form>
    </div>
  );
};

NotificationComments.propTypes = {
  comments: PropTypes.array,
  onAddComment: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default NotificationComments;