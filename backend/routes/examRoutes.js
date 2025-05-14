import express from 'express';
import {
  createExam,
  updateExam,
  publishExam,
  listActiveExams,
  deleteExam,
  startExamAttempt,
  unpublishExam,
  toggleExamStatus
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
  checkExistingAttempt,
  canViewExam
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

// List Active Exams (Students)
router.get('/active', 
  userAuth, 
  isStudent, 
  listActiveExams // Controller handles filtering
);

// Fetch exam details based on creator
router.get('/my-exams',
  userAuth,
  isFacultyOrAdmin,
  async (req, res) => {
    try {
      // Make sure we're using the right field name - updating from createdBy to creatorId if needed
      const exams = await Exam.find({ 
        $or: [
          { createdBy: req.user.id },
          { creatorId: req.user.id }
        ]
      });
      res.json({ exams });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Fetch all exams (Admin only)
router.get('/all',
  userAuth,
  isFacultyOrAdmin,
  async (req, res) => {
    try {
      // Add both possible field names to the populate to ensure we get creator data
      const exams = await Exam.find()
        .populate('createdBy', 'firstName lastName')
        .lean();
        
      // Make sure each exam has creatorId set for frontend consistency
      const processedExams = exams.map(exam => {
        // If exam has createdBy but no creatorId, set creatorId
        if (exam.createdBy && !exam.creatorId) {
          if (typeof exam.createdBy === 'object') {
            exam.creatorId = exam.createdBy._id;
          } else {
            exam.creatorId = exam.createdBy;
          }
        }
        return exam;
      });
      
      res.json({ exams: processedExams });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get('/attempted', userAuth,
  isStudent,
   async (req, res) => {
  try {
    const studentId = req.user.role === 'Student' ? req.user.id : req.query.studentId;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    // Find all distinct exam IDs from exam attempts for this student
    const attemptedExamIds = await ExamAttempt.find({ studentId })
      .distinct('examId');
    
    // Get the exam details for these IDs
    const exams = await Exam.find({
      _id: { $in: attemptedExamIds }
    }).select('title description totalMarks passingPercentage');

    res.status(200).json({
      success: true,
      exams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

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

router.patch('/:examId/:action(publish|unpublish)',
  userAuth,
  isFacultyOrAdmin,
  isExamCreator,
  toggleExamStatus
);

// Single Exam Fetch
router.get('/:examId',
  userAuth,
  canViewExam,
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.examId)
        .select('-__v')
        .lean();

      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Ensure we have consistent creator info
      if (exam.createdBy && !exam.creatorId) {
        exam.creatorId = typeof exam.createdBy === 'object' ? exam.createdBy._id : exam.createdBy;
      }
      
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

export default router;