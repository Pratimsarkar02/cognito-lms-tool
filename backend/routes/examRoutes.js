import express from 'express';
import {
  createExam,
  updateExam,
  publishExam,
  listActiveExams,
  deleteExam,
  startExamAttempt,
  unpublishExam
} from '../controllers/examController.js';
import {
  isFacultyOrAdmin,
  isStudent
} from '../middleware/roleMiddleware.js';
import userAuth from '../middleware/userAuth.js';
import {
  isExamCreator,
  isExamActive,
  checkAttemptLimit,
  checkExistingAttempt
} from '../middleware/examMiddleware.js';
import { checkExamTimeout } from '../middleware/timeoutMiddleware.js';
import Exam from '../models/examModel.js';
import ExamAttempt from '../models/examAttemptModel.js';

const router = express.Router();

// Create Exam (Faculty/Admin)
router.post('/', 
  userAuth, 
  isFacultyOrAdmin, 
  createExam
);
//Update Exam (Faculty/Admin)
router.put('/:examId',
  userAuth,
  isFacultyOrAdmin,
  isExamCreator,
  updateExam
);
// Publish Exam (Exam Creator)
router.patch('/:examId/publish', 
  userAuth, 
  isFacultyOrAdmin,
  isExamCreator, // Checks ownership
  publishExam
);
// Unpublish Exam (Exam Creator)
router.patch('/:examId/unpublish',
  userAuth,
  isFacultyOrAdmin,
  isExamCreator,
  unpublishExam
)

// List Active Exams (Students)
router.get('/active', 
  userAuth, 
  isStudent, 
  listActiveExams // Controller handles filtering
);
// Single Exam Fetch
router.get('/:examId',
  userAuth,
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.examId)
        .select('-createdBy -__v')
        .lean();
      res.json({ exam });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Start Exam Attempt (Students)
router.post('/:examId/attempt', 
  userAuth, 
  isStudent,
  checkExistingAttempt,
  isExamActive, // Check exam is published and in time window
  checkAttemptLimit, // Check attempt count
  startExamAttempt
);
// Check Exam Attempt TImeout (Students)
router.get('/:examId/attempt',
  userAuth,
  isStudent,
  async (req, res) => {
    try {
      const attempt = await ExamAttempt.findOne({
        examId: req.params.examId,
        studentId: req.user.id,
        isActive: true
      })
      .populate('examId')
      .lean();
      
      if (!attempt) return res.status(404).json({ message: "No active attempt" });
      
      res.json({ success: true, attempt });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
// Deprecated notice for old complete route
router.post('/:examId/complete', (req, res) => {
  res.status(410).json({
    success: false,
    message: "This endpoint is deprecated. Please use the new endpoint."
  });
});
// Delete Exam (Exam Creator)
router.delete('/:examId', 
  userAuth, 
  isFacultyOrAdmin,
  isExamCreator, 
  deleteExam
);

// Fetch exam details based on creator
router.get('/my-exams',
  userAuth,
  isFacultyOrAdmin,
  async (req, res) => {
    try {
      const exams = await Exam.find({ createdBy: req.user.id });
      res.json({ exams });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
// Fetch exam details based on admin
router.get('/all',
  userAuth,
  isFacultyOrAdmin,
  async (req, res) => {
    try {
      const exams = await Exam.find().populate('createdBy', 'firstName lastName');
      res.json({ exams });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;