import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
} from "../controllers/notificationController.js";
import { uploadNotificationAttachments } from "../middleware/uploadMiddleware.js";

const notificationRouter = express.Router();

notificationRouter.post("/",
  userAuth,
  uploadNotificationAttachments,
  createNotification
);

notificationRouter.get("/", 
    userAuth, 
    getNotifications
);
notificationRouter.get("/:id", 
    userAuth, 
    getNotificationById
);

notificationRouter.put(
  "/:id",
  userAuth,
  uploadNotificationAttachments,
  updateNotification
);

notificationRouter.delete("/:id", 
    userAuth,
     deleteNotification
    );

export default notificationRouter;