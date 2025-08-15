import express from 'express';
import {
  getStudentResult,
  exportExamResults,
  getResults,
  generateResults,
  getAllStudentResults
} from '../controllers/resultController.js';
import {
  isFacultyOrAdmin
} from '../middleware/roleMiddleware.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

// Generate Results (Faculty/Admin only)
router.post(
  '/:examId/results/generate',
  userAuth,
  isFacultyOrAdmin,
  generateResults
);

// Get all results for logged-in user or specified student
router.get(
  '/all',
  userAuth,
  getAllStudentResults
);

// Get Results for a specific exam (Authenticated users)
router.get(
  '/:examId',
  userAuth,
  getResults
);



// Export Results (Faculty/Admin only)
router.get(
  '/:examId/export-results',
  userAuth,
  isFacultyOrAdmin,
  exportExamResults
);

export default router;