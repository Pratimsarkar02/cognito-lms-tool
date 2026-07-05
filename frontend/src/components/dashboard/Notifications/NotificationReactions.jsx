import PropTypes from "prop-types";
import { REACTION_OPTIONS } from "../../../utils/notificationHelpers";

const NotificationReactions = ({
  reactions = [],
  currentUserId,
  onReact,
  onRemoveReaction,
  disabled = false,
}) => {
  const activeReaction = reactions.find(
    (reaction) => reaction.userId?.toString?.() === currentUserId || reaction.userId === currentUserId
  );

  const getCount = (type) => reactions.filter((reaction) => reaction.type === type).length;

  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_OPTIONS.map((option) => {
        const count = getCount(option.type);
        const isActive = activeReaction?.type === option.type;

        return (
          <button
            key={option.type}
            type="button"
            disabled={disabled}
            onClick={() => (isActive ? onRemoveReaction() : onReact(option.type))}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
              isActive
                ? "border-teal-600 bg-teal-50 text-teal-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{option.emoji}</span>
            <span>{option.label}</span>
            {count > 0 && <span className="text-xs font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};

NotificationReactions.propTypes = {
  reactions: PropTypes.array,
  currentUserId: PropTypes.string,
  onReact: PropTypes.func.isRequired,
  onRemoveReaction: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default NotificationReactions;