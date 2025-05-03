import ExamAttempt from "../models/examAttemptModel.js";

export const checkAttemptExists = async (req, res, next) => {
    const attempt = await ExamAttempt.findOne({
      examId: req.params.examId,
      studentId: req.user.id,
      isActive: true
    });
  
    if (!attempt) {
      return res.status(403).json({
        success: false,
        message: "Start exam attempt first"
      });
    }
    
    req.attempt = attempt;
    next();
  };