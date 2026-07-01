import streamifier from "streamifier";
import multer from "multer";
import Notification from "../models/notificationModel.js";
import cloudinary from "../config/cloudinary.js";

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

  if (error.message === "Unsupported file type") {
    return res.status(400).json({
      success: false,
      message:
        "Unsupported file type. Allowed types: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, TXT",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export const createNotification = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !["Admin", "Faculty"].includes(user.role)) {
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

    let parsedTargetRoles = [];

    if (typeof targetRoles === "string") {
      try {
        parsedTargetRoles = JSON.parse(targetRoles);
      } catch {
        parsedTargetRoles = [targetRoles];
      }
    } else if (Array.isArray(targetRoles)) {
      parsedTargetRoles = targetRoles;
    }

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
      targetRoles:
        parsedTargetRoles.length > 0 ? parsedTargetRoles : ["Student"],
      attachments,
      externalLink: externalLink || "",
      eventDate: eventDate || null,
      isPinned: String(isPinned) === "true" || isPinned === true,
      status: status || "published",
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate("createdBy", "firstName lastName email role profileImage")
      .lean();

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

    const notification = await Notification.findOne({
      _id: id,
      deletedAt: null,
      targetRoles: user.role,
    })
      .populate("createdBy", "firstName lastName email role profileImage")
      .populate("comments.userId", "firstName lastName email role profileImage");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
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

export const updateNotification = async (req, res, next) => {
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

    const isCreator = notification.createdBy.toString() === user.id.toString();
    const isAdmin = user.role === "Admin";

    if (!isCreator && !isAdmin) {
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

    let parsedTargetRoles = notification.targetRoles;
    let parsedRemovedAttachmentIds = [];

    if (typeof targetRoles === "string") {
      try {
        parsedTargetRoles = JSON.parse(targetRoles);
      } catch {
        parsedTargetRoles = [targetRoles];
      }
    } else if (Array.isArray(targetRoles)) {
      parsedTargetRoles = targetRoles;
    }

    if (typeof removedAttachmentIds === "string") {
      try {
        parsedRemovedAttachmentIds = JSON.parse(removedAttachmentIds);
      } catch {
        parsedRemovedAttachmentIds = [removedAttachmentIds];
      }
    } else if (Array.isArray(removedAttachmentIds)) {
      parsedRemovedAttachmentIds = removedAttachmentIds;
    }

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

    const updatedNotification = await Notification.findById(notification._id)
      .populate("createdBy", "firstName lastName email role profileImage")
      .lean();

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

export const deleteNotification = async (req, res, next) => {
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

    const isCreator = notification.createdBy.toString() === user.id.toString();
    const isAdmin = user.role === "Admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this notification",
      });
    }

    if (notification.attachments?.length) {
      await deleteFromCloudinary(notification.attachments);
    }

    await Notification.findByIdAndDelete(id);

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