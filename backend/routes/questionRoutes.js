import express from 'express';
import {
  addQuestion,
  updateQuestion,
  getExamQuestions,
  deleteQuestion
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

// Update Question (Exam Creator only)
router.put(
  '/:questionId/update',
  userAuth,
  isFacultyOrAdmin,
  isExamCreator,
  updateQuestion
);

// Get Exam Questions (Any authenticated user + Active exam)
router.get(
  '/:examId/questions',
  userAuth,
  isExamActive,
  checkAttemptExists,
  getExamQuestions
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