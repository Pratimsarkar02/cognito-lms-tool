import express from 'express';
import {
  addQuestion,
  updateQuestion,
  getExamQuestions,
  deleteQuestion,
  getExamQuestionsForManagement,
  updateIndividualQuestion,
  deleteIndividualQuestion
} from '../controllers/questionController.js';
import { checkAttemptExists } from '../middleware/checkAttemptExists.js';
import {
  isFacultyOrAdmin
} from '../middleware/roleMiddleware.js';
import userAuth from '../middleware/userAuth.js';
import {
  isExamCreator,
  isExamActive,
  isQuestionOwner
} from '../middleware/examMiddleware.js';
import { validateQuestions } from '../middleware/questionValidation.js';

const router = express.Router();

// Add Question (Exam Creator only)
router.post(
  '/:examId/questions/add',
  userAuth,
  isFacultyOrAdmin,
  isExamCreator,
  validateQuestions,
  addQuestion
);

// NEW: Get Questions for Management (Faculty/Admin only) - NO ACTIVE EXAM REQUIRED
router.get(
  '/:examId/questions/manage',
  userAuth,
  isFacultyOrAdmin,
  isExamCreator,
  getExamQuestionsForManagement
);

// Get Exam Questions (Requires Active exam + attempt)
router.get(
  '/:examId/questions',
  userAuth,
  isExamActive,
  checkAttemptExists,
  getExamQuestions
);

// NEW: Update Individual Question
router.put(
  '/question/:questionId/update',
  userAuth,
  isFacultyOrAdmin,
  isQuestionOwner,
  updateIndividualQuestion
);

// NEW: Delete Individual Question
router.delete(
  '/question/:questionId/delete',
  userAuth,
  isFacultyOrAdmin,
  isQuestionOwner,
  deleteIndividualQuestion
);

// Legacy Routes (Keep for Backward compatibility)

// Update Question (Exam Creator only)
router.put(
  '/:questionId/update',
  userAuth,
  isFacultyOrAdmin,
  isQuestionOwner,
  updateQuestion
);

//Delete Question (Exam Creator only)
router.delete(
  '/:questionId/delete',
  userAuth,
  isFacultyOrAdmin,
  isQuestionOwner,
  deleteQuestion
);

export default router;