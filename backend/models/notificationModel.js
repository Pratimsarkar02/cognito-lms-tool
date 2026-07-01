import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },
    publicId: {
  type: String,
  default: "",
  trim: true,
}
  },
  { _id: true }
);

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user-details",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "support", "love", "insightful"],
      default: "like",
    },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user-details",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user-details",
      required: true,
    },
    category: {
      type: String,
      enum: ["announcement", "event", "academic", "general", "urgent"],
      default: "announcement",
    },
    targetRoles: {
      type: [
        {
          type: String,
          enum: ["Student", "Faculty", "Admin"],
        },
      ],
      default: ["Student"],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    externalLink: {
      type: String,
      default: "",
      trim: true,
    },
    eventDate: {
      type: Date,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["published", "archived"],
      default: "published",
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ targetRoles: 1, createdAt: -1 });
notificationSchema.index({ createdBy: 1, createdAt: -1 });
notificationSchema.index({ status: 1, isPinned: -1, createdAt: -1 });

 const notificationModel = mongoose.models['Notification'] || mongoose.model('Notification', notificationSchema);
 
  export default notificationModel;