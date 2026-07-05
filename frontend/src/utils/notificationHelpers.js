export const REACTION_OPTIONS = [
  { type: "like", label: "Like", emoji: "👍" },
  { type: "support", label: "Support", emoji: "👏" },
  { type: "love", label: "Love", emoji: "❤️" },
  { type: "insightful", label: "Insightful", emoji: "💡" },
];

export const CATEGORY_STYLES = {
  announcement: "bg-blue-100 text-blue-800",
  event: "bg-purple-100 text-purple-800",
  academic: "bg-emerald-100 text-emerald-800",
  general: "bg-slate-100 text-slate-800",
  urgent: "bg-rose-100 text-rose-800",
};

export const formatNotificationDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const sortNotifications = (items = []) => {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

export const upsertNotification = (items = [], notification) => {
  const exists = items.some((item) => item._id === notification._id);
  const next = exists
    ? items.map((item) => (item._id === notification._id ? notification : item))
    : [notification, ...items];

  return sortNotifications(next);
};

export const removeNotificationById = (items = [], notificationId) => {
  return items.filter((item) => item._id !== notificationId);
};

export const patchNotificationCollection = (items = [], notificationId, patch) => {
  return items.map((item) =>
    item._id === notificationId
      ? {
          ...item,
          ...patch,
        }
      : item
  );
};

export const getFullName = (user) => {
  if (!user) return "Unknown user";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown user";
};