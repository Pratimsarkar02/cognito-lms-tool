import mongoose from 'mongoose';
import Exam from '../models/examModel.js';
import ExamAttempt from '../models/examAttemptModel.js';
import Question from '../models/questionModel.js';

export const isExamCreator = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .select('createdBy')
      .lean();

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: "Exam not found" 
      });
    }

    if (exam.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to modify this exam" 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const isExamActive = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .select('status startTime endTime')
      .lean();

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: "Exam not found" 
      });
    }

    const currentTime = new Date();
    if (exam.status !== 'published' || 
        currentTime < exam.startTime || 
        currentTime >= exam.endTime) {
      return res.status(403).json({ 
        success: false, 
        message: "Exam is not currently active" 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const checkAttemptLimit = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    
    // Unlimited attempts allowed
    if (exam.maxAttempts === 0) return next();

    // Count only completed attempts
    const completedAttempts = await ExamAttempt.countDocuments({
      examId: req.params.examId,
      studentId: req.user.id,
      isCompleted: true
    });

    // Allow new attempt if under limit OR has active attempt
    if (completedAttempts >= exam.maxAttempts) {
      const activeAttempt = await ExamAttempt.findOne({
        examId: req.params.examId,
        studentId: req.user.id,
        isActive: true
      });

      if (!activeAttempt) {
        return res.status(403).json({
          success: false,
          message: "Maximum attempt limit reached"
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const isQuestionOwner = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.questionId)
      .populate('examId', 'createdBy');

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: "Question not found" 
      });
    }

    if (question.examId.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to modify this question" 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const validateExamTiming = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    // Get active attempt
    const attempt = await ExamAttempt.findOne({
      examId,
      studentId,
      isActive: true
    });

    if (!attempt) {
      return res.status(403).json({
        success: false,
        message: "No active exam session"
      });
    }

    // Get exam duration
    const exam = await Exam.findById(examId);
    const elapsedSeconds = (Date.now() - attempt.startTime) / 1000;

    if (elapsedSeconds > exam.duration * 60) {
      await ExamAttempt.findByIdAndUpdate(attempt._id, {
        isActive: false,
        isCompleted: true
      });
      
      return res.status(403).json({
        success: false,
        message: "Exam time expired"
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const checkExistingAttempt = async (req, res, next) => {
  try {
    const existing = await ExamAttempt.findOne({
      examId: req.params.examId,
      studentId: req.user.id,
      isActive: true
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Existing attempt in progress. Resume your exam first."
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const canViewExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('createdBy', 'role _id');
    
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (req.user.role === 'Admin' || 
        exam.createdBy._id.equals(req.user.id) ||
        req.user.role === 'Student' && exam.status === 'published') {
      return next();
    }
    
    res.status(403).json({ message: 'Unauthorized access' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};