import express from 'express';
import {
  createExam,
  updateExam,
  publishExam,
  listActiveExams,
  deleteExam,
  startExamAttempt,
  completeExamAttempt
} from '../controllers/examController.js';
import {
  isFacultyOrAdmin,
  isStudent
} from '../middleware/roleMiddleware.js';
import userAuth from '../middleware/userAuth.js';
import {
  isExamCreator,
  isExamActive,
  checkAttemptLimit
} from '../middleware/examMiddleware.js';
import { checkExamTimeout } from '../middleware/timeoutMiddleware.js';

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

// List Active Exams (Students)
router.get('/active', 
  userAuth, 
  isStudent, 
  listActiveExams // Controller handles filtering
);

// Start Exam Attempt (Students)
router.post('/:examId/attempt', 
  userAuth, 
  //isStudent,
  isExamActive, // Check exam is published and in time window
  checkAttemptLimit, // Check attempt count
  startExamAttempt
);
/* // Complete Exam Attempt (Students)
router.post('/:examId/complete', 
  userAuth, 
  isStudent,
  isExamActive,
  checkExamTimeout,
  completeExamAttempt
); */
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