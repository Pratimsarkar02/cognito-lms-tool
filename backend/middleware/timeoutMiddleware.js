import ExamAttempt from "../models/examAttemptModel.js";
import Exam from "../models/examLogModel.js";
import ExamLog from "../models/examLogModel.js";

export const checkExamTimeout = async (req, res, next) => {
  try {
    const attempt = await ExamAttempt.findOne({
      examId: req.params.examId,
      studentId: req.user.id,
      isActive: true
    });

    if (!attempt) return next();

    const elapsedSeconds = (Date.now() - attempt.startTime) / 1000;
    const remainingTime = attempt.duration - elapsedSeconds;

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

      examLog.events.push({
        type: 'complete',
        timestamp: new Date(),
        metadata: {
          reason: 'timeout'
        }
      });
      await examLog.save();
      
      return res.status(403).json({ 
        success: false, 
        message: "Exam time expired" 
      });
    }

    // Add buffer for network latency
    res.set('X-Remaining-Time', Math.floor(remainingTime - 5));
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};