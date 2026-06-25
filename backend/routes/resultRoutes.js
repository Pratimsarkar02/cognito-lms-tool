// resultRoutes.js — complete rewrite
import express from 'express';
import {
  getResults,
  generateResults,
  publishResults,
  unpublishResults,
  getAllStudentResults,
  exportExamResults,
} from '../controllers/resultController.js';
import { isFacultyOrAdmin } from '../middleware/roleMiddleware.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

// ⚠️  ORDER MATTERS: '/all' MUST come before '/:examId'
// If /:examId is first, Express treats the string "all" as an examId — silent bug.

// GET all results filtered by logged-in user's role (Student/Faculty/Admin)
router.get('/all', userAuth, getAllStudentResults);

// POST generate results for an exam (Faculty/Admin only)
router.post('/:examId/generate', userAuth, isFacultyOrAdmin, generateResults);

// PATCH publish results — makes results visible to students (Faculty/Admin only)
router.patch('/:examId/publish', userAuth, isFacultyOrAdmin, publishResults);

// PATCH unpublish results — hides from students again (Faculty/Admin only)
router.patch('/:examId/unpublish', userAuth, isFacultyOrAdmin, unpublishResults);

// GET export results as CSV (Faculty/Admin only) — must be before /:examId
router.get('/:examId/export', userAuth, isFacultyOrAdmin, exportExamResults);

// GET results for one specific exam (role-filtered — MUST be last wildcard)
router.get('/:examId', userAuth, getResults);

export default router;