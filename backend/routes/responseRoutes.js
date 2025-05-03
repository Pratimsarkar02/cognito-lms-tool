import express from 'express';
import {
  submitResponse,
  gradeResponse,
  submitBatchResponses
} from '../controllers/responseController.js';
import {
  isStudent,
  isFacultyOrAdmin
} from '../middleware/roleMiddleware.js';
import userAuth from '../middleware/userAuth.js';
import {
  isExamActive,
  validateExamTiming,
  checkAttemptLimit
} from '../middleware/examMiddleware.js';
import { checkExamTimeout } from '../middleware/timeoutMiddleware.js';
import { logExamActivity } from '../middleware/loggingMiddleware.js';

const router = express.Router();

/* // Submit Response (Student + Active exam + Attempt limit check)
router.post(
  '/:examId/questions/:questionId/responses',
  userAuth,
  isStudent,
  isExamActive,
  checkAttemptLimit,
  checkExamTimeout,
  logExamActivity,
  submitResponse
);
 */
// Grade Response (Faculty/Admin only)
router.put(
  '/:responseId/grade',
  userAuth,
  isFacultyOrAdmin,
  gradeResponse
);

// Submit Batch Responses (Student + Active exam + Attempt limit check)
router.post(
  '/:examId/batch',
  userAuth,
  //isStudent,
  isExamActive,
  checkAttemptLimit,
  validateExamTiming,
  checkExamTimeout,
  submitBatchResponses
);


export default router;