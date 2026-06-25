// examRoutes.js — /attempted route FIXED to include resultsStatus
import express from 'express';
import {
  createExam,
  updateExam,
  publishExam,
  listActiveExams,
  deleteExam,
  startExamAttempt,
  unpublishExam,
  toggleExamStatus,
  getMyExams,
  getAllExams
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
router.post('/', userAuth, isFacultyOrAdmin, createExam);

// List Active Exams (Students only)
router.get('/active', userAuth, isStudent, listActiveExams);

// Get exams created by logged-in faculty/admin
router.get('/my-exams', userAuth, isFacultyOrAdmin, getMyExams);

// Get all exams in the system (Faculty/Admin)
router.get('/all', userAuth, isFacultyOrAdmin, getAllExams);

// ─── FIXED: now includes resultsStatus, startTime, endTime in select ─────────
// Students need resultsStatus so ExamResults.jsx can show "Awaiting" vs actual score.
router.get('/attempted', userAuth, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    const attemptedExamIds = await ExamAttempt.find({ studentId }).distinct('examId');

    const exams = await Exam.find({ _id: { $in: attemptedExamIds } })
      .select('title description totalMarks passingPercentage resultsStatus startTime endTime')
      .lean();

    res.status(200).json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Exam (must be creator)
router.put('/:examId', userAuth, isFacultyOrAdmin, isExamCreator, updateExam);

// Publish / Unpublish Exam (must be creator)
router.patch('/:examId/publish', userAuth, isFacultyOrAdmin, isExamCreator, publishExam);
router.patch('/:examId/unpublish', userAuth, isFacultyOrAdmin, isExamCreator, unpublishExam);
router.patch('/:examId/:action(publish|unpublish)', userAuth, isFacultyOrAdmin, isExamCreator, toggleExamStatus);

// Single Exam Fetch (populates createdBy)
router.get('/:examId', userAuth, canViewExam, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('createdBy', 'firstName lastName email role')
      .select('-__v')
      .lean();

    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (exam.createdBy && !exam.creatorId) {
      exam.creatorId = typeof exam.createdBy === 'object' ? exam.createdBy._id : exam.createdBy;
    }

    res.json({ exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start Exam Attempt (Students)
router.post('/:examId/attempt',
  userAuth, isStudent, checkExistingAttempt, isExamActive, checkAttemptLimit, startExamAttempt
);

// Check Active Attempt status (Students)
router.get('/:examId/attempt', userAuth, isStudent, async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({
      examId: req.params.examId,
      studentId: req.user.id,
      isActive: true,
    }).populate('examId').lean();

    if (!attempt) return res.status(404).json({ message: 'No active attempt' });
    res.json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Deprecated complete route
router.post('/:examId/complete', (req, res) => {
  res.status(410).json({ success: false, message: 'This endpoint is deprecated.' });
});

// Delete Exam
router.delete('/:examId', userAuth, isFacultyOrAdmin, isExamCreator, deleteExam);

export default router;