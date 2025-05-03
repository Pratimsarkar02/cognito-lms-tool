import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
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
    marksObtained: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number },
    isPassed: { type: Boolean },
    bestAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamAttempt", // Ensure correct reference
      required: true,
    },
    allAttempts: [
      {
        attemptId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "ExamAttempt" 
        },
        percentage: Number,
        marksObtained: Number,
        totalMarks: Number,
        timestamp: {  // Add for better tracking
          type: Date,
          default: Date.now
        }
      }
    ],
  },
  { timestamps: true }
);

resultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
resultSchema.index({ percentage: 1 });
resultSchema.index({ isPassed: 1 });

const resultModel = mongoose.models["Result"] || mongoose.model("Result", resultSchema);

export default resultModel;
