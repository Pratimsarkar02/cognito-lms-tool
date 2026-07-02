import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  reactToNotification,
  removeReactionFromNotification,
  addCommentToNotification,
  updateCommentOnNotification,
  deleteCommentFromNotification,
  getAllNotificationsForModeration,
  archiveNotification,
  publishNotification,
  pinNotification,
  unpinNotification,
} from "../controllers/notificationController.js";
import { uploadNotificationAttachments } from "../middleware/uploadMiddleware.js";

const notificationRouter = express.Router();

notificationRouter.post(
  "/",
  userAuth,
  uploadNotificationAttachments,
  createNotification
);

notificationRouter.get("/", userAuth, getNotifications);
notificationRouter.get("/moderation/all", userAuth, getAllNotificationsForModeration);
notificationRouter.get("/:id", userAuth, getNotificationById);

notificationRouter.put(
  "/:id",
  userAuth,
  uploadNotificationAttachments,
  updateNotification
);

notificationRouter.delete("/:id", userAuth, deleteNotification);

notificationRouter.post("/:id/reactions", userAuth, reactToNotification);
notificationRouter.delete("/:id/reactions", userAuth, removeReactionFromNotification);

notificationRouter.post("/:id/comments", userAuth, addCommentToNotification);
notificationRouter.put("/:id/comments/:commentId", userAuth, updateCommentOnNotification);
notificationRouter.delete("/:id/comments/:commentId", userAuth, deleteCommentFromNotification);

notificationRouter.patch("/:id/archive", userAuth, archiveNotification);
notificationRouter.patch("/:id/publish", userAuth, publishNotification);
notificationRouter.patch("/:id/pin", userAuth, pinNotification);
notificationRouter.patch("/:id/unpin", userAuth, unpinNotification);

export default notificationRouter;