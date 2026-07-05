// frontend/src/components/dashboard/UserAvatar.jsx
import PropTypes from "prop-types";

const PALETTE = [
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-sky-500", text: "text-white" },
  { bg: "bg-violet-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
];

const getColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const getInitials = (firstName = "", lastName = "") => {
  const first = firstName?.trim()?.[0] || "";
  const last = lastName?.trim()?.[0] || "";
  return `${first}${last}`.toUpperCase() || first.toUpperCase() || last.toUpperCase() || "?";
};

/**
 * @param {string} firstName
 * @param {string} lastName
 * @param {'sm'|'md'|'lg'} size
 */
const UserAvatar = ({ firstName = "", lastName = "", size = "md" }) => {
  const fullName = `${firstName} ${lastName}`.trim() || "?";
  const initials = getInitials(firstName, lastName);
  const { bg, text } = getColor(fullName);

  const sizeMap = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-14 h-14 text-lg",
  };

  return (
    <div
      className={`${sizeMap[size]} ${bg} ${text} rounded-full flex items-center justify-center font-semibold shrink-0 select-none`}
      aria-label={fullName}
      title={fullName}
    >
      {initials}
    </div>
  );
};

UserAvatar.propTypes = {
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
};

export default UserAvatar;