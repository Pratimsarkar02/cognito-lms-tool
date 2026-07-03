import streamifier from "streamifier";
import multer from "multer";
import Notification from "../models/notificationModel.js";
import cloudinary from "../config/cloudinary.js";
import userModel from "../models/userModel.js";
import { buildNotificationPublishedEmail } from "../utils/emailTemplates.js";
import { sendSystemEmail } from "../utils/emailService.js";

const ALLOWED_REACTIONS = ["like", "support", "love", "insightful"];

const sanitizePublicIdPart = (value = "") => {
  return value
    .replace(/\.[^/.]+$/, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .replace(/-+/g, "-");
};

const getCloudinaryResourceType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
};

// Emits a notification event to specific role rooms (e.g. role:Student, role:Faculty).
// Falls back to a global emit only if no roles are passed (used for hard deletes).
const emitToRoles = (req, eventName, payload, roles = []) => {
  const io = req.app.get("io");
  if (!io) {
    console.log(`[Socket] Skipped emit "${eventName}" — io instance not found on app`);
    return;
  }

  if (!roles.length) {
    console.log(`[Socket] Emitting "${eventName}" globally (no roles specified)`);
    io.emit(eventName, payload);
    return;
  }

  roles.forEach((role) => {
    console.log(`[Socket] Emitting "${eventName}" to room role:${role}`);
    io.to(`role:${role}`).emit(eventName, payload);
  });
};

// Emits a notification event to one specific user's private room (user:<id>).
// Currently unused by default flows, but kept ready for per-user targeted alerts later.
const emitToUser = (req, eventName, payload, userId) => {
  const io = req.app.get("io");
  if (!io || !userId) {
    console.log(`[Socket] Skipped emit "${eventName}" — missing io or userId`);
    return;
  }
  console.log(`[Socket] Emitting "${eventName}" to room user:${userId}`);
  io.to(`user:${userId}`).emit(eventName, payload);
};

const canModerateNotification = (user) => {
  return !!user && ["Admin", "Faculty"].includes(user.role);
};

const canManageNotification = (user, notification) => {
  if (!user || !notification) return false;
  const isAdmin = user.role === "Admin";
  const isCreator = notification.createdBy.toString() === user.id.toString();
  return isAdmin || isCreator;
};

const canAccessNotification = (user, notification) => {
  if (!user || !notification) return false;
  if (user.role === "Admin") return true;
  return notification.targetRoles.includes(user.role);
};

const uploadBufferToCloudinary = (fileBuffer, folder, originalname) =>
  new Promise((resolve, reject) => {
    const safeName = sanitizePublicIdPart(originalname);
    const publicId = `${Date.now()}-${safeName}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });

const deleteFromCloudinary = async (attachments = []) => {
  if (!Array.isArray(attachments) || attachments.length === 0) return;

  const deletionResults = await Promise.allSettled(
    attachments
      .filter((file) => file?.publicId)
      .map((file) =>
        cloudinary.uploader.destroy(file.publicId, {
          resource_type: getCloudinaryResourceType(file.fileType),
        })
      )
  );

  const failedDeletes = deletionResults.filter(
    (result) => result.status === "rejected"
  );

  if (failedDeletes.length > 0) {
    const firstFailure = failedDeletes[0].reason;
    throw new Error(
      firstFailure?.message || "Failed to delete one or more Cloudinary files"
    );
  }
};

const handleUploadError = (error, res) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the 10MB limit",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 5 attachments",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "File upload error",
    });
  }

  if (error.message?.includes("Unsupported file type")) {
    return res.status(400).json({
      success: false,
      message:
        "Unsupported file type. Allowed types: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, TXT",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};

const parseRoleArray = (targetRoles, fallback = ["Student"]) => {
  if (typeof targetRoles === "string") {
    try {
      const parsed = JSON.parse(targetRoles);
      return Array.isArray(parsed) && parsed.length ? parsed : fallback;
    } catch {
      return targetRoles ? [targetRoles] : fallback;
    }
  }

  if (Array.isArray(targetRoles) && targetRoles.length) {
    return targetRoles;
  }

  return fallback;
};

const parseStringArray = (value) => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value ? [value] : [];
    }
  }

  return Array.isArray(value) ? value : [];
};

const getNotificationWithPopulates = async (id) => {
  return Notification.findById(id)
    .populate("createdBy", "firstName lastName email role profileImage")
    .populate("comments.userId", "firstName lastName email role profileImage")
    .lean();
};

const notifyRecipientsByEmail = async (notification, { isRepublish = false } = {}) => {
  try {
    const recipients = await userModel
      .find({ role: { $in: notification.targetRoles } })
      .select("firstName lastName email role");

    if (!recipients.length) return;

    await Promise.allSettled(
      recipients
        .filter((recipient) => recipient.email)
        .map((recipient) => {
          const emailPayload = buildNotificationPublishedEmail({
            recipientName: `${recipient.firstName} ${recipient.lastName}`.trim(),
            notification,
            recipientRole: recipient.role,
            isRepublish,
          });

          return sendSystemEmail({
            to: recipient.email,
            subject: emailPayload.subject,
            html: emailPayload.html,
            category: isRepublish ? "notification_republished" : "notification_published",
          });
        })
    );
  } catch (emailError) {
    console.error("[Email] Notification email batch failed:", emailError.message);
  }
};


export const createNotification = async (req, res) => {
  try {
    const user = req.user;

    if (!canModerateNotification(user)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const {
      title,
      description,
      category,
      targetRoles,
      externalLink,
      eventDate,
      isPinned,
      status,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const parsedTargetRoles = parseRoleArray(targetRoles);
    const attachments = [];

    if (req.files?.length) {
      for (const file of req.files) {
        const uploaded = await uploadBufferToCloudinary(
          file.buffer,
          "cognito-lms/notifications",
          file.originalname
        );

        attachments.push({
          fileName: file.originalname,
          fileUrl: uploaded.secure_url,
          fileType: file.mimetype,
          fileSize: file.size,
          publicId: uploaded.public_id,
        });
      }
    }

    const notification = await Notification.create({
      title: title.trim(),
      description: description.trim(),
      createdBy: user.id,
      category: category || "announcement",
      targetRoles: parsedTargetRoles,
      attachments,
      externalLink: externalLink || "",
      eventDate: eventDate || null,
      isPinned: String(isPinned) === "true" || isPinned === true,
      status: status || "published",
    });

    const populatedNotification = await getNotificationWithPopulates(notification._id);

    emitToRoles(
      req,
      "notification:created",
      { notification: populatedNotification },
      populatedNotification.targetRoles
    );

    // Fire the email only when the notification is created already-published
    if (populatedNotification.status === "published") {
      notifyRecipientsByEmail(populatedNotification, { isRepublish: false });
    }

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: populatedNotification,
    });
  } catch (error) {
    return handleUploadError(error, res);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const query = {
      status: "published",
      deletedAt: null,
      targetRoles: user.role,
    };

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("createdBy", "firstName lastName email role profileImage")
        .populate("comments.userId", "firstName lastName email role profileImage")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationById = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const notification = await Notification.findById(id)
      .populate("createdBy", "firstName lastName email role profileImage")
      .populate("comments.userId", "firstName lastName email role profileImage");

    if (!notification || notification.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canAccessNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this notification",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotification = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canManageNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this notification",
      });
    }

    const {
      title,
      description,
      category,
      targetRoles,
      externalLink,
      eventDate,
      isPinned,
      status,
      removedAttachmentIds,
    } = req.body;

    const parsedTargetRoles = parseRoleArray(targetRoles, notification.targetRoles);
    const parsedRemovedAttachmentIds = parseStringArray(removedAttachmentIds);

    if (title !== undefined) notification.title = title.trim();
    if (description !== undefined) notification.description = description.trim();
    if (category !== undefined) notification.category = category;
    if (externalLink !== undefined) notification.externalLink = externalLink;
    if (eventDate !== undefined) notification.eventDate = eventDate || null;
    if (isPinned !== undefined) {
      notification.isPinned = String(isPinned) === "true" || isPinned === true;
    }
    if (status !== undefined) notification.status = status;

    notification.targetRoles = parsedTargetRoles;
    notification.editedAt = new Date();

    if (parsedRemovedAttachmentIds.length > 0) {
      const attachmentsToRemove = notification.attachments.filter((attachment) =>
        parsedRemovedAttachmentIds.includes(attachment._id.toString())
      );

      if (attachmentsToRemove.length > 0) {
        await deleteFromCloudinary(attachmentsToRemove);
      }

      notification.attachments = notification.attachments.filter(
        (attachment) =>
          !parsedRemovedAttachmentIds.includes(attachment._id.toString())
      );
    }

    if (req.files?.length) {
      for (const file of req.files) {
        const alreadyExists = notification.attachments.some(
          (attachment) =>
            attachment.fileName === file.originalname &&
            attachment.fileSize === file.size
        );

        if (alreadyExists) continue;

        const uploaded = await uploadBufferToCloudinary(
          file.buffer,
          "cognito-lms/notifications",
          file.originalname
        );

        notification.attachments.push({
          fileName: file.originalname,
          fileUrl: uploaded.secure_url,
          fileType: file.mimetype,
          fileSize: file.size,
          publicId: uploaded.public_id,
        });
      }
    }

    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired on any edit (title, description, attachments, targetRoles, etc).
    emitToRoles(
      req,
      "notification:updated",
      { notification: updatedNotification },
      updatedNotification.targetRoles
    );

    return res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Update notification error:", error);
    return handleUploadError(error, res);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canManageNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this notification",
      });
    }

    if (notification.attachments?.length) {
      await deleteFromCloudinary(notification.attachments);
    }

    const affectedRoles = notification.targetRoles;

    await Notification.findByIdAndDelete(id);

    // Fired on hard delete — document is gone, so we notify its former target roles directly.
    emitToRoles(
      req,
      "notification:deleted",
      { notificationId: id },
      affectedRoles
    );

    return res.status(200).json({
      success: true,
      message: "Notification and related attachments deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete notification",
    });
  }
};

export const reactToNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { type } = req.body;

    if (!ALLOWED_REACTIONS.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reaction type",
      });
    }

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt || notification.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canAccessNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to react to this notification",
      });
    }

    const existingReaction = notification.reactions.find(
      (reaction) => reaction.userId.toString() === user.id.toString()
    );

    if (existingReaction) {
      existingReaction.type = type;
    } else {
      notification.reactions.push({
        userId: user.id,
        type,
      });
    }

    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired whenever any user reacts or changes their reaction type.
    emitToRoles(
      req,
      "notification:reacted",
      { notificationId: notification._id, reactions: updatedNotification.reactions },
      updatedNotification.targetRoles
    );

    return res.status(200).json({
      success: true,
      message: "Reaction saved successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const removeReactionFromNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt || notification.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canAccessNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove reaction from this notification",
      });
    }

    const originalLength = notification.reactions.length;

    notification.reactions = notification.reactions.filter(
      (reaction) => reaction.userId.toString() !== user.id.toString()
    );

    if (notification.reactions.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Reaction not found",
      });
    }

    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired when a user removes their own reaction.
    emitToRoles(
      req,
      "notification:reaction_removed",
      { notificationId: notification._id, reactions: updatedNotification.reactions },
      updatedNotification.targetRoles
    );

    return res.status(200).json({
      success: true,
      message: "Reaction removed successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const addCommentToNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt || notification.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canAccessNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to comment on this notification",
      });
    }

    notification.comments.push({
      userId: user.id,
      text: text.trim(),
    });

    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired when a new comment is added.
    emitToRoles(
      req,
      "notification:comment_added",
      { notificationId: notification._id, comments: updatedNotification.comments },
      updatedNotification.targetRoles
    );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCommentOnNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id, commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const comment = notification.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isCommentOwner = comment.userId.toString() === user.id.toString();
    const isAdmin = user.role === "Admin";

    if (!isCommentOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this comment",
      });
    }

    comment.text = text.trim();
    comment.editedAt = new Date();

    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired when a comment is edited.
    emitToRoles(
      req,
      "notification:comment_updated",
      { notificationId: notification._id, comments: updatedNotification.comments },
      updatedNotification.targetRoles
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCommentFromNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id, commentId } = req.params;

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const comment = notification.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isCommentOwner = comment.userId.toString() === user.id.toString();
    const isAdmin = user.role === "Admin";
    const isNotificationOwner = notification.createdBy.toString() === user.id.toString();

    if (!isCommentOwner && !isAdmin && !isNotificationOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    comment.deleteOne();
    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired when a comment is deleted (by owner, notification creator, or admin).
    emitToRoles(
      req,
      "notification:comment_deleted",
      { notificationId: notification._id, comments: updatedNotification.comments },
      updatedNotification.targetRoles
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllNotificationsForModeration = async (req, res, next) => {
  try {
    const user = req.user;

    if (!canModerateNotification(user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = {
      deletedAt: null,
    };

    if (status && ["published", "archived"].includes(status)) {
      query.status = status;
    }

    if (user.role !== "Admin") {
      query.createdBy = user.id;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("createdBy", "firstName lastName email role profileImage")
        .populate("comments.userId", "firstName lastName email role profileImage")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const archiveNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canManageNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to archive this notification",
      });
    }

    notification.status = "archived";
    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired when a notification is archived — targeted clients should hide it live.
    emitToRoles(
      req,
      "notification:archived",
      { notification: updatedNotification },
      updatedNotification.targetRoles
    );

    return res.status(200).json({
      success: true,
      message: "Notification archived successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const publishNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (!canManageNotification(user, notification)) {
      return res.status(403).json({ success: false, message: "Not authorized to publish this notification" });
    }

    // Only a true archive -> published transition counts as a "republish"
    const wasArchived = notification.status === "archived";

    notification.status = "published";
    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    emitToRoles(
      req,
      "notification:published",
      { notification: updatedNotification },
      updatedNotification.targetRoles
    );

    if (wasArchived) {
      notifyRecipientsByEmail(updatedNotification, { isRepublish: true });
    }

    return res.status(200).json({
      success: true,
      message: "Notification published successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const pinNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canManageNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pin this notification",
      });
    }

    notification.isPinned = true;
    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired when a notification is pinned to the top of the feed.
    emitToRoles(
      req,
      "notification:pinned",
      { notification: updatedNotification },
      updatedNotification.targetRoles
    );

    return res.status(200).json({
      success: true,
      message: "Notification pinned successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

export const unpinNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification || notification.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (!canManageNotification(user, notification)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to unpin this notification",
      });
    }

    notification.isPinned = false;
    await notification.save();

    const updatedNotification = await getNotificationWithPopulates(notification._id);

    // Fired when a notification is unpinned.
    emitToRoles(
      req,
      "notification:unpinned",
      { notification: updatedNotification },
      updatedNotification.targetRoles
    );

    return res.status(200).json({
      success: true,
      message: "Notification unpinned successfully",
      notification: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};