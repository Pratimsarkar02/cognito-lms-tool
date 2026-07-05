import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Funnel, RefreshCcw } from "lucide-react";
import { AppContent } from "../../../contexts/AppContext";
import { notificationService } from "../../../services/notificationService";
import {
  patchNotificationCollection,
  removeNotificationById,
  sortNotifications,
  upsertNotification,
} from "../../../utils/notificationHelpers";
import NotificationCard from "./NotificationCard";
import NotificationEmptyState from "./NotificationEmptyState";
import NotificationSectionHeader from "./NotificationSectionHeader";
import NotificationSkeleton from "./NotificationSkeleton";
import NotificationComposer from "./NotificationComposer";
import { getSocket } from "../../../utils/socket";

const FILTER_DEFAULTS = {
  category: "all",
  pinnedOnly: false,
  hasEvent: false,
  search: "",
};

const NotificationFeed = () => {
  const {
    authState: { userData },
  } = useContext(AppContent);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [editingNotification, setEditingNotification] = useState(null);

  const currentUserId = userData?._id || userData?.id;
  const canCompose = ["Admin", "Faculty"].includes(userData?.role);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");
      const response = await notificationService.getNotifications({ page: 1, limit: 20 });
      setNotifications(sortNotifications(response.notifications || []));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setFetchError(error?.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn("[NotificationFeed] Socket not initialized yet — skipping live updates");
      return;
    }

    const handleCreated = ({ notification }) => {
      setNotifications((prev) => upsertNotification(prev, notification));
    };

    const handleUpdated = ({ notification }) => {
      setNotifications((prev) => upsertNotification(prev, notification));
    };

    const handlePublished = ({ notification }) => {
      setNotifications((prev) => upsertNotification(prev, notification));
    };

    const handleArchived = ({ notification }) => {
      setNotifications((prev) => removeNotificationById(prev, notification._id));
    };

    const handleDeleted = ({ notificationId }) => {
      setNotifications((prev) => removeNotificationById(prev, notificationId));
    };

    const handleReacted = ({ notificationId, reactions }) => {
      setNotifications((prev) =>
        patchNotificationCollection(prev, notificationId, { reactions })
      );
    };

    const handleReactionRemoved = ({ notificationId, reactions }) => {
      setNotifications((prev) =>
        patchNotificationCollection(prev, notificationId, { reactions })
      );
    };

    const handleCommentAdded = ({ notificationId, comments }) => {
      setNotifications((prev) =>
        patchNotificationCollection(prev, notificationId, { comments })
      );
    };

    const handleCommentUpdated = ({ notificationId, comments }) => {
      setNotifications((prev) =>
        patchNotificationCollection(prev, notificationId, { comments })
      );
    };

    const handleCommentDeleted = ({ notificationId, comments }) => {
      setNotifications((prev) =>
        patchNotificationCollection(prev, notificationId, { comments })
      );
    };

    socket.on("notification:created", handleCreated);
    socket.on("notification:updated", handleUpdated);
    socket.on("notification:published", handlePublished);
    socket.on("notification:archived", handleArchived);
    socket.on("notification:deleted", handleDeleted);
    socket.on("notification:reacted", handleReacted);
    socket.on("notification:reaction_removed", handleReactionRemoved);
    socket.on("notification:comment_added", handleCommentAdded);
    socket.on("notification:comment_updated", handleCommentUpdated);
    socket.on("notification:comment_deleted", handleCommentDeleted);

    return () => {
      socket.off("notification:created", handleCreated);
      socket.off("notification:updated", handleUpdated);
      socket.off("notification:published", handlePublished);
      socket.off("notification:archived", handleArchived);
      socket.off("notification:deleted", handleDeleted);
      socket.off("notification:reacted", handleReacted);
      socket.off("notification:reaction_removed", handleReactionRemoved);
      socket.off("notification:comment_added", handleCommentAdded);
      socket.off("notification:comment_updated", handleCommentUpdated);
      socket.off("notification:comment_deleted", handleCommentDeleted);
    };
  }, []);

  const handleReact = async (notificationId, type) => {
    try {
      const response = await notificationService.reactToNotification(notificationId, type);
      setNotifications((prev) => upsertNotification(prev, response.notification));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not react to notification");
    }
  };

  const handleRemoveReaction = async (notificationId) => {
    try {
      const response = await notificationService.removeReaction(notificationId);
      setNotifications((prev) => upsertNotification(prev, response.notification));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not remove reaction");
    }
  };

  const handleAddComment = async (notificationId, text) => {
    try {
      const response = await notificationService.addComment(notificationId, text);
      setNotifications((prev) => upsertNotification(prev, response.notification));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not add comment");
      throw error;
    }
  };

  const handleUpdateComment = async (notificationId, commentId, text) => {
    try {
      const response = await notificationService.updateComment(notificationId, commentId, text);
      setNotifications((prev) => upsertNotification(prev, response.notification));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update comment");
      throw error;
    }
  };

  const handleDeleteComment = async (notificationId, commentId) => {
    try {
      const response = await notificationService.deleteComment(notificationId, commentId);
      setNotifications((prev) => upsertNotification(prev, response.notification));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not delete comment");
      throw error;
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesCategory =
        filters.category === "all" || notification.category === filters.category;

      const matchesPinned = !filters.pinnedOnly || notification.isPinned;
      const matchesEvent = !filters.hasEvent || Boolean(notification.eventDate);

      const query = filters.search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        notification.title?.toLowerCase().includes(query) ||
        notification.description?.toLowerCase().includes(query) ||
        notification.createdBy?.firstName?.toLowerCase().includes(query) ||
        notification.createdBy?.lastName?.toLowerCase().includes(query);

      return matchesCategory && matchesPinned && matchesEvent && matchesSearch;
    });
  }, [notifications, filters]);

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(
        notifications
          .map((notification) => notification.category)
          .filter(Boolean)
      )
    );
    return ["all", ...values];
  }, [notifications]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-4">
          <NotificationSkeleton />
          <NotificationSkeleton />
          <NotificationSkeleton />
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">
          {fetchError}
        </div>
      );
    }

    if (!filteredNotifications.length) {
      return <NotificationEmptyState />;
    }

    return (
      <div className="space-y-5">
        {filteredNotifications.map((notification) => (
          <NotificationCard
            key={notification._id}
            notification={notification}
            currentUserId={currentUserId}
            currentUserRole={userData?.role}
            currentUser={userData}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            onEditRequested={setEditingNotification}
            onUpdated={(updatedNotification) =>
              setNotifications((prev) => upsertNotification(prev, updatedNotification))
            }
            onDeleted={(notificationId) =>
              setNotifications((prev) => removeNotificationById(prev, notificationId))
            }
          />
        ))}
      </div>
    );
  }, [loading, fetchError, filteredNotifications, currentUserId, userData]);

  return (
    <section className="space-y-5">
      <NotificationSectionHeader />

      {canCompose && (
        <NotificationComposer
          userData={userData}
          editingNotification={editingNotification}
          onCancelEdit={() => setEditingNotification(null)}
          onCreated={(notification) =>
            setNotifications((prev) => upsertNotification(prev, notification))
          }
          onUpdated={(updatedNotification) => {
            setNotifications((prev) => upsertNotification(prev, updatedNotification));
            setEditingNotification(null);
          }}
        />
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Funnel size={16} className="text-cyan-600" />
            Feed filters
          </div>

          <button
            type="button"
            onClick={() => {
              setFilters(FILTER_DEFAULTS);
              fetchNotifications();
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCcw size={15} />
            Reset
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="text"
            placeholder="Search posts or creators"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          />

          <select
            value={filters.category}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, category: event.target.value }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All categories" : category}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.pinnedOnly}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, pinnedOnly: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            Only pinned
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.hasEvent}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, hasEvent: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            Event posts only
          </label>
        </div>
      </div>

      {content}
    </section>
  );
};

export default NotificationFeed;