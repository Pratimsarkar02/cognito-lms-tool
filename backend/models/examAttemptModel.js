import mongoose from "mongoose";

// models/examAttemptModel.js
const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user-details",
      required: true,
    },
    // Session Management Fields
    startTime: {
      type: Date,
      default: Date.now,
    },
    duration: {
      type: Number,
      set: function(v) {
        return this.endTime 
          ? Math.round((this.endTime - this.startTime) / 1000)
          : v;
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    questionOrder: [mongoose.Schema.Types.ObjectId], // Original question order
    optionOrder: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
  },
  { timestamps: true }
);

examAttemptSchema.index(
  { examId: 1, studentId: 1, isCompleted: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isCompleted: false,
    },
  }
);
examAttemptSchema.index({ examId: 1, studentId: 1 });

const examAttemptModel =
  mongoose.models["ExamAttempt"] ||
  mongoose.model("ExamAttempt", examAttemptSchema);
export default examAttemptModel;
