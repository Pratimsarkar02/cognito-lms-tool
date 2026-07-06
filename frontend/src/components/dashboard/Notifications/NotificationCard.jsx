import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Heart,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  Pin,
  SendHorizontal,
  ShieldCheck,
  ThumbsUp,
  Trash2,
  Pencil,
  Archive,
  Upload,
  Eye,
  EyeOff,
  ArchiveX,
  X,
} from "lucide-react";
import { notificationService } from "../../../services/notificationService";
import ConfirmationModal from "../../common/ConfirmationModal";
import { useConfirmationModal } from "../../../hooks/useConfirmationModal";

const REACTIONS = [
  {
    type: "like",
    label: "Like",
    Icon: ThumbsUp,
    buttonClass: "hover:bg-blue-50 hover:text-blue-600",
    activeClass: "bg-blue-50 text-blue-600 border-blue-200",
    iconWrapClass: "bg-blue-100 text-blue-600",
  },
  {
    type: "love",
    label: "Love",
    Icon: Heart,
    buttonClass: "hover:bg-rose-50 hover:text-rose-600",
    activeClass: "bg-rose-50 text-rose-600 border-rose-200",
    iconWrapClass: "bg-rose-100 text-rose-600",
  },
  {
    type: "support",
    label: "Support",
    Icon: ShieldCheck,
    buttonClass: "hover:bg-emerald-50 hover:text-emerald-600",
    activeClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
    iconWrapClass: "bg-emerald-100 text-emerald-600",
  },
  {
    type: "insightful",
    label: "Insightful",
    Icon: Lightbulb,
    buttonClass: "hover:bg-amber-50 hover:text-amber-600",
    activeClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconWrapClass: "bg-amber-100 text-amber-700",
  },
];

const STATUS_META = {
  published: {
    label: "Published",
    className: "bg-emerald-50 text-emerald-700",
    Icon: CheckCircle2,
  },
  archived: {
    label: "Archived",
    className: "bg-slate-100 text-slate-600",
    Icon: ArchiveX,
  },
};

const CATEGORY_OPTIONS = ["announcement", "event", "academic", "general", "urgent"];

const formatNotificationDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

const getFullName = (user) => {
  if (!user) return "Unknown user";
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email || "Unknown user";
};

const getInitials = (user) => {
  const first = user?.firstName?.[0] || "";
  const last = user?.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase() || "U";
};

const isImageAttachment = (fileType = "") => fileType.startsWith("image/");
const isVideoAttachment = (fileType = "") => fileType.startsWith("video/");

const EditNotificationModal = ({ notification, isOpen, onClose, onSaved }) => {
  const [title, setTitle] = useState(notification?.title || "");
  const [description, setDescription] = useState(notification?.description || "");
  const [category, setCategory] = useState(notification?.category || "announcement");
  const [eventDate, setEventDate] = useState(formatDateForInput(notification?.eventDate));
  const [externalLink, setExternalLink] = useState(notification?.externalLink || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && notification) {
      setTitle(notification.title || "");
      setDescription(notification.description || "");
      setCategory(notification.category || "announcement");
      setEventDate(formatDateForInput(notification.eventDate));
      setExternalLink(notification.externalLink || "");
    }
  }, [isOpen, notification]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSaving) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("externalLink", externalLink.trim());
      if (eventDate) {
        formData.append("eventDate", new Date(eventDate).toISOString());
      } else {
        formData.append("eventDate", "");
      }

      const response = await notificationService.updateNotification(notification._id, formData);
      toast.success(response?.message || "Notification updated");
      onSaved?.(response.notification);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update notification");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 cursor-pointer bg-slate-950/60 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-notification-title"
        className="relative w-full max-w-lg  animate-[modal-in_180ms_ease-out] rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => !isSaving && onClose()}
          disabled={isSaving}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full cursor-pointer p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
        >
          <X size={16} />
        </button>

        <h2 id="edit-notification-title" className="text-lg font-semibold text-slate-950">
          Edit notification
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={150}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={5000}
              className="w-full resize-none rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-2xl border cursor-pointer border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Event date</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className="w-full rounded-2xl border cursor-pointer border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">External link</label>
            <input
              type="url"
              value={externalLink}
              onChange={(event) => setExternalLink(event.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-full cursor-pointer border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-full cursor-pointer bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-70"
          >
            {isSaving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

EditNotificationModal.propTypes = {
  notification: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
};

const NotificationCard = ({
  notification,
  currentUserId,
  currentUserRole,
  currentUser,
  onReact,
  onRemoveReaction,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onUpdated,
  onDeleted,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [originalEditingText, setOriginalEditingText] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionClamped, setIsDescriptionClamped] = useState(false);

  const actionRef = useRef(null);
  const reactionTrayTimeoutRef = useRef(null);
  const descriptionRef = useRef(null);

  const {
    isOpen: isConfirmOpen,
    config: confirmConfig,
    isProcessing: isConfirmProcessing,
    openConfirmation,
    closeConfirmation,
    handleConfirm,
  } = useConfirmationModal();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionRef.current && !actionRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (descriptionRef.current) {
      const isOverflowing =
        descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight + 1;
      setIsDescriptionClamped(isOverflowing || isDescriptionExpanded);
    }
  }, [notification.description, isDescriptionExpanded]);

  const myReaction = useMemo(() => {
    return notification.reactions?.find(
      (reaction) => String(reaction.userId) === String(currentUserId)
    );
  }, [notification.reactions, currentUserId]);

  const reactionCounts = useMemo(() => {
    return (notification.reactions || []).reduce((accumulator, reaction) => {
      accumulator[reaction.type] = (accumulator[reaction.type] || 0) + 1;
      return accumulator;
    }, {});
  }, [notification.reactions]);

  const canManage = useMemo(() => {
    const creatorId = notification?.createdBy?._id || notification?.createdBy?.id;
    return currentUserRole === "Admin" || String(creatorId) === String(currentUserId);
  }, [notification, currentUserId, currentUserRole]);

  const openReactionTray = () => {
    if (reactionTrayTimeoutRef.current) {
      clearTimeout(reactionTrayTimeoutRef.current);
    }
    setShowReactionBar(true);
  };

  const closeReactionTray = () => {
    reactionTrayTimeoutRef.current = setTimeout(() => {
      setShowReactionBar(false);
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (reactionTrayTimeoutRef.current) {
        clearTimeout(reactionTrayTimeoutRef.current);
      }
    };
  }, []);

  const handleCommentSubmit = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setSubmittingComment(true);
      await onAddComment(notification._id, commentText.trim());
      setCommentText("");
    } finally {
      setSubmittingComment(false);
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingText(comment.text);
    setOriginalEditingText(comment.text);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingText("");
    setOriginalEditingText("");
  };

  const handleEditComment = async (commentId) => {
    if (!editingText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      await onUpdateComment(notification._id, commentId, editingText.trim());
      cancelEditingComment();
    } catch {
      // handled in feed
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await onDeleteComment(notification._id, commentId);
    } catch {
      // handled in feed
    }
  };

  const runModerationAction = async (actionType) => {
    let response;

    if (actionType === "pin") {
      response = await notificationService.pinNotification(notification._id);
    } else if (actionType === "unpin") {
      response = await notificationService.unpinNotification(notification._id);
    } else if (actionType === "archive") {
      response = await notificationService.archiveNotification(notification._id);
    } else if (actionType === "publish") {
      response = await notificationService.publishNotification(notification._id);
    } else if (actionType === "delete") {
      response = await notificationService.deleteNotification(notification._id);
    }

    if (actionType === "delete") {
      toast.success(response?.message || "Notification deleted");
      onDeleted?.(notification._id);
    } else {
      toast.success(response?.message || "Notification updated");
      onUpdated?.(response.notification);
    }

    setShowActions(false);
  };

  const handlePinToggle = async () => {
    try {
      await runModerationAction(notification.isPinned ? "unpin" : "pin");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Action failed");
    }
  };

  const requestPublishConfirmation = () => {
    setShowActions(false);
    openConfirmation({
      tone: "neutral",
      title: "Publish this notification?",
      description:
        "Publishing makes this notification visible to all targeted users immediately. You can archive it again later if needed.",
      confirmLabel: "Publish",
      onConfirm: async () => {
        try {
          await runModerationAction("publish");
        } catch (error) {
          toast.error(error?.response?.data?.message || "Failed to publish notification");
          throw error;
        }
      },
    });
  };

  const requestArchiveConfirmation = () => {
    setShowActions(false);
    openConfirmation({
      tone: "warning",
      title: "Archive this notification?",
      description:
        "Archived notifications are hidden from the main feed but not deleted. You can publish it again anytime.",
      confirmLabel: "Archive",
      onConfirm: async () => {
        try {
          await runModerationAction("archive");
        } catch (error) {
          toast.error(error?.response?.data?.message || "Failed to archive notification");
          throw error;
        }
      },
    });
  };

  const requestDeleteConfirmation = () => {
    setShowActions(false);
    openConfirmation({
      tone: "danger",
      title: "Delete this notification?",
      description:
        "This action is permanent and cannot be undone. All reactions and comments on this notification will also be removed.",
      confirmLabel: "Delete permanently",
      onConfirm: async () => {
        try {
          await runModerationAction("delete");
        } catch (error) {
          toast.error(error?.response?.data?.message || "Failed to delete notification");
          throw error;
        }
      },
    });
  };

  const statusMeta = STATUS_META[notification.status] || STATUS_META.published;
  const StatusIcon = statusMeta.Icon;

  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-sky-500 text-sm font-bold text-white shadow-sm">
            {getInitials(notification.createdBy)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-[15px] font-semibold text-slate-900">
                    {getFullName(notification.createdBy)}
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {notification.category}
                  </span>
                  {canManage && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusMeta.className}`}
                    >
                      <StatusIcon size={12} />
                      {statusMeta.label}
                    </span>
                  )}
                  {notification.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      <Pin size={12} />
                      Pinned
                    </span>
                  )}
                  {notification.eventDate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                      <CalendarDays size={12} />
                      Event
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{formatNotificationDate(notification.createdAt)}</span>
                  {notification.editedAt && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      Edited
                    </span>
                  )}
                  {notification.createdBy?.role && (
                    <span>{notification.createdBy.role}</span>
                  )}
                </div>
              </div>

              {canManage && (
                <div className="relative" ref={actionRef}>
                  <button
                    type="button"
                    onClick={() => setShowActions((prev) => !prev)}
                    className="rounded-full p-2 cursor-pointer text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {showActions && (
                    <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setShowActions(false);
                          setIsEditModalOpen(true);
                        }}
                        className="flex w-full items-center cursor-pointer gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil size={16} />
                        Edit notification
                      </button>

                      <button
                        type="button"
                        onClick={handlePinToggle}
                        className="flex w-full items-center cursor-pointer gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pin size={16} />
                        {notification.isPinned ? "Unpin post" : "Pin post"}
                      </button>

                      <button
                        type="button"
                        onClick={
                          notification.status === "published"
                            ? requestArchiveConfirmation
                            : requestPublishConfirmation
                        }
                        className="flex w-full items-center cursor-pointer gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        {notification.status === "published" ? (
                          <>
                            <Archive size={16} />
                            Archive post
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Publish post
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={requestDeleteConfirmation}
                        className="flex w-full items-center cursor-pointer gap-3 px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                        Delete post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-semibold leading-tight text-slate-900">
                {notification.title}
              </h4>
              <div className="relative">
                <p
                  ref={descriptionRef}
                  className={`mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 ${
                    !isDescriptionExpanded ? "line-clamp-2 pr-10" : ""
                  }`}
                >
                  {notification.description}
                </p>
                {isDescriptionClamped && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    className={`text-sm font-serif cursor-pointer text-cyan-700 transition hover:text-cyan-800 ${
                      !isDescriptionExpanded
                        ? "absolute right-0 bottom-[-0.8rem] pl-5 text-sm"
                        : "mt-1 relative"
                    }`}
                  >
                    {isDescriptionExpanded ? "See less" : "View more"}
                  </button>
                )}
              </div>

              {notification.eventDate && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700">
                  <CalendarDays size={16} />
                  Event date: {formatNotificationDate(notification.eventDate)}
                </div>
              )}
            </div>

            {!!notification.attachments?.length && (
              <div className="mt-4 grid gap-3">
                {notification.attachments.map((attachment) => (
                  <div
                    key={attachment._id || attachment.fileUrl}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    {isImageAttachment(attachment.fileType) && (
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          className="max-h-[420px] w-full object-cover"
                        />
                      </a>
                    )}

                    {isVideoAttachment(attachment.fileType) && (
                      <video
                        controls
                        className="max-h-[420px] w-full bg-black"
                        src={attachment.fileUrl}
                      />
                    )}

                    {!isImageAttachment(attachment.fileType) &&
                      !isVideoAttachment(attachment.fileType) && (
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-4 text-sm text-slate-700 transition hover:bg-slate-100"
                        >
                          <FileText size={18} className="text-slate-500" />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {attachment.fileName}
                          </span>
                          <ExternalLink size={16} className="text-slate-400" />
                        </a>
                      )}
                  </div>
                ))}
              </div>
            )}

            {notification.externalLink && (
              <a
                href={notification.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-800 transition hover:bg-cyan-100"
              >
                <ExternalLink size={16} />
                <span className="truncate font-medium">{notification.externalLink}</span>
              </a>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-3">
              <div
                className="relative"
                onMouseEnter={openReactionTray}
                onMouseLeave={closeReactionTray}
              >
                {(() => {
                  const selectedReaction =
                    REACTIONS.find((reaction) => reaction.type === myReaction?.type) || REACTIONS[0];

                  const selectedCount = myReaction?.type
                    ? reactionCounts[myReaction.type] || 0
                    : (notification.reactions || []).length;

                  const SelectedIcon = selectedReaction.Icon;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (myReaction?.type) {
                            onRemoveReaction(notification._id);
                          } else {
                            onReact(notification._id, "like");
                          }
                        }}
                        className={`group inline-flex items-center gap-2 rounded-full cursor-pointer border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          myReaction?.type
                            ? `${selectedReaction.activeClass} shadow-sm`
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition duration-200 ${
                            myReaction?.type
                              ? selectedReaction.iconWrapClass
                              : "bg-slate-100 text-slate-600 group-hover:scale-110"
                          }`}
                        >
                          <SelectedIcon size={16} />
                        </span>

                        <span>{myReaction?.type ? selectedReaction.label : "React"}</span>

                        {selectedCount > 0 && (
                          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {selectedCount}
                          </span>
                        )}
                      </button>

                      <div
                        className={`absolute left-0 bottom-full z-30 mb-3 origin-bottom-left transition-all duration-200 ${
                          showReactionBar
                            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                            : "pointer-events-none translate-y-2 scale-95 opacity-0"
                        }`}
                      >
                        <div className="flex items-end gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
                          {REACTIONS.map(({ type, label, Icon, iconWrapClass }) => {
                            const active = myReaction?.type === type;

                            return (
                              <button
                                key={type}
                                type="button"
                                aria-label={label}
                                title={label}
                                onClick={() => {
                                  onReact(notification._id, type);
                                  setShowReactionBar(false);
                                }}
                                className="group relative flex h-12 w-12 items-center justify-center rounded-full cursor-pointer transition-all duration-200 hover:-translate-y-3 hover:scale-110 focus-visible:-translate-y-2"
                              >
                                <span
                                  className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
                                    active
                                      ? `${iconWrapClass} ring-2 ring-slate-200`
                                      : `${iconWrapClass}`
                                  }`}
                                >
                                  <Icon size={18} />
                                </span>

                                <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-sm transition duration-150 group-hover:-translate-y-1 group-hover:opacity-100">
                                  {label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(reactionCounts).map(([type, count]) => {
                  if (!count) return null;

                  const reactionMeta = REACTIONS.find((reaction) => reaction.type === type);
                  if (!reactionMeta) return null;

                  const Icon = reactionMeta.Icon;

                  return (
                    <div
                      key={type}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${reactionMeta.iconWrapClass}`}>
                        <Icon size={11} />
                      </span>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowComments((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full cursor-pointer px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <MessageCircle size={16} />
                {showComments ? (
                  <>
                    <EyeOff size={15} />
                    Hide comments
                  </>
                ) : (
                  <>
                    <Eye size={15} />
                    Comments ({notification.comments?.length || 0})
                  </>
                )}
              </button>
            </div>

            {showComments && (
              <div className="mt-4 space-y-4 rounded-3xl bg-slate-50 p-4">
                <form onSubmit={handleCommentSubmit} className="flex items-end gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-xs font-bold text-white">
                    {getInitials(currentUser)}
                  </div>

                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Write a comment..."
                      className="w-full resize-none border-none bg-transparent px-2 py-1 text-sm text-slate-700 outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment}
                        className="inline-flex items-center gap-2 rounded-full cursor-pointer bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
                      >
                        <SendHorizontal size={15} />
                        {submittingComment ? "Posting..." : "Comment"}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="space-y-3">
                  {(notification.comments || []).map((comment) => {
                    const commentOwnerId = comment?.userId?._id || comment?.userId?.id || comment?.userId;
                    const isOwnComment = String(commentOwnerId) === String(currentUserId);
                    
                      String(commentOwnerId) ===
                      String(notification?.createdBy?._id || notification?.createdBy?.id);
                    const commentName = getFullName(comment.userId);
                    const canEditComment = isOwnComment;
                    const canDeleteComment = isOwnComment || canManage;
                    const isEditingThis = editingCommentId === comment._id;
                    const isSaveDisabled = editingText === originalEditingText;

                    return (
                      <div
                        key={comment._id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {commentName}
                              {isOwnComment && (
                                <span className="ml-2 text-[11px] font-normal text-slate-500">
                                  (author)
                                </span>
                              )}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>{formatNotificationDate(comment.createdAt)}</span>
                              {comment.editedAt && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                  Edited
                                </span>
                              )}
                            </div>
                          </div>

                          {(canEditComment || canDeleteComment) && (
                            <div className="flex items-center gap-1">
                              {canEditComment && (
                                <button
                                  type="button"
                                  onClick={() => startEditingComment(comment)}
                                  className="rounded-full p-2 cursor-pointer text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}

                              {canDeleteComment && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="rounded-full p-2 cursor-pointer text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {isEditingThis ? (
                          <div className="mt-3">
                            <textarea
                              rows={3}
                              value={editingText}
                              onChange={(event) => setEditingText(event.target.value)}
                              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelEditingComment}
                                className="rounded-full border cursor-pointer border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditComment(comment._id)}
                                disabled={isSaveDisabled}
                                className="rounded-full cursor-pointer bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {comment.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title={confirmConfig?.title || ""}
        description={confirmConfig?.description || ""}
        tone={confirmConfig?.tone || "neutral"}
        confirmLabel={confirmConfig?.confirmLabel || "Confirm"}
        isLoading={isConfirmProcessing}
        onConfirm={handleConfirm}
        onClose={closeConfirmation}
      />

      <EditNotificationModal
        notification={notification}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={onUpdated}
      />
    </article>
  );
};

NotificationCard.propTypes = {
  notification: PropTypes.object.isRequired,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currentUserRole: PropTypes.string,
  currentUser: PropTypes.object,
  onReact: PropTypes.func.isRequired,
  onRemoveReaction: PropTypes.func.isRequired,
  onAddComment: PropTypes.func.isRequired,
  onUpdateComment: PropTypes.func.isRequired,
  onDeleteComment: PropTypes.func.isRequired,
  onUpdated: PropTypes.func,
  onDeleted: PropTypes.func,
};

export default NotificationCard;