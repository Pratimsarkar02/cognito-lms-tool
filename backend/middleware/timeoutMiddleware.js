import ExamAttempt from "../models/examAttemptModel.js";
import Exam from "../models/examModel.js"; // Fixed import - should be examModel, not examLogModel
import ExamLog from "../models/examLogModel.js";

export const checkExamTimeout = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findOne({
      examId: req.params.examId,
      studentId: req.user.id,
      isActive: true
    });

    if (!attempt) return next();

    // Get exam details for duration
    const exam = await Exam.findById(req.params.examId);
    const elapsedSeconds = (Date.now() - attempt.startTime) / 1000;
    const examDurationSeconds = exam.duration * 60;
    
    // **Add grace period for auto-submit**
    const gracePeriodSeconds = 10; // 10 seconds grace period
    const maxAllowedTime = examDurationSeconds + gracePeriodSeconds;
    const remainingTime = maxAllowedTime - elapsedSeconds;

    // Only timeout if beyond grace period
    if (remainingTime <= 0) {
      await ExamAttempt.findByIdAndUpdate(attempt._id, {
        isActive: false,
        isCompleted: true,
        $inc: { attemptCount: 1 }
      });

      const examLog = await ExamLog.findOne({
        examId: req.params.examId,
        studentId: req.user.id,
        attemptId: attempt._id
      });

      if (examLog) {
        examLog.events.push({
          type: 'complete',
          timestamp: new Date(),
          metadata: {
            reason: 'timeout'
          }
        });
        await examLog.save();
      }

      return res.status(403).json({
        success: false,
        message: "Exam time expired"
      });
    }

    // Set remaining time in header (official exam time, not including grace period)
    const officialRemainingTime = Math.max(examDurationSeconds - elapsedSeconds, 0);
    res.set('X-Remaining-Time', Math.floor(officialRemainingTime - 5)); // 5 second buffer for network latency

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
