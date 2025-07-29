import mongoose from 'mongoose';
import Response from '../models/responseModel.js';
import Question from '../models/questionModel.js';
import Result from '../models/resultModel.js';
import ExamAttempt from '../models/examAttemptModel.js';
import ExamLog from '../models/examLogModel.js';
import Exam from '../models/examModel.js';
import { updateExamAnalytics } from '../controllers/analyticsController.js';
import examModel from '../models/examModel.js';

// Helper function for array comparison
const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
};

// Enhanced calculateMarks function
const calculateMarks = async (examId, studentId, attemptId) => {
  const attempt = await ExamAttempt.findById(attemptId).lean();
  const exam = await Exam.findById(examId);
  
  const responses = await Response.find({ examId, studentId, examAttemptId: attemptId })
    .populate({
      path: 'questionId',
      select: 'marks options isAutoGraded',
      model: 'Question'
    });

  let totalMarks = 0;

  for (const response of responses) {
    const question = response.questionId;
    if (!question?.isAutoGraded) continue;

    const optionMap = attempt.optionOrder[question._id.toString()]; // String key access
const originalIndexes = response.selectedOptions
  .map(clientIdx => optionMap[clientIdx])
  .sort();

    // Compare answers
    const isCorrect = arraysEqual(originalIndexes, correctIndexes);
    
    // Calculate marks for this question
    let marks = 0;
    if (isCorrect) {
      marks = question.marks;
    } else if (exam.isNegativeMarking) {
      marks = -(question.marks * (exam.negativeMarkingPercentage / 100));
    }
    // Update individual response
    await Response.findByIdAndUpdate(response._id, {
      isCorrect,
      marksObtained: marks,
      originalSelectedOptions: originalIndexes
    });

    // Update total marks (ensure non-negative)
    totalMarks = Math.max(totalMarks + marks, 0);
  }

  // Update final result
  return Result.findOneAndUpdate(
    { examId, studentId },
    {
      totalMarks: exam.totalMarks,
      marksObtained: totalMarks,
      percentage: Number(((totalMarks / exam.totalMarks) * 100).toFixed(2)),
      isPassed: totalMarks >= (exam.totalMarks * exam.passingPercentage / 100),
      attemptId
    },
    { upsert: true, new: true }
  );
};

const validateBatchPayload = (responses, attempt) => {
  const errors = [];
  
  Object.entries(responses).forEach(([questionId, indexes]) => {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      errors.push(`Invalid question ID: ${questionId}`);
    }
    
    // Changed from .get() to object access
    const optionMap = attempt.optionOrder[questionId];
    
    if (!optionMap) {
      errors.push(`Question ${questionId} not in this attempt`);
      return;
    }
    
    indexes.forEach(idx => {
      if (idx < 0 || idx >= optionMap.length) {
        errors.push(`Invalid option index ${idx} for question ${questionId}`);
      }
    });
  });
  
  return errors;
};

// New helper function
const generateResultsForStudent = async (examId, studentId) => {
  const result = await Result.findOne({ examId, studentId })
    .populate('allAttempts.attemptId');
  
  if (!result) return;

  let bestAttempt = result.allAttempts[0];
  for (const attempt of result.allAttempts) {
    if (attempt.percentage > bestAttempt.percentage) {
      bestAttempt = attempt;
    }
  }

  await Result.findByIdAndUpdate(result._id, {
    bestAttemptId: bestAttempt.attemptId._id,
    percentage: bestAttempt.percentage,
    isPassed: bestAttempt.percentage >= Exam.passingPercentage
  });
};

export const submitResponse = async (req, res) => {
  try {
    const start = Date.now();

    const { examId, questionId } = req.params;
    const { selectedOptions } = req.body;

    //geting exam document (not attempt) for negative marking
    const exam = await examModel.findById(examId);
    if(!exam){
      return res.status(404).json({ 
        success: false, 
        message: "Exam not found" 
      });
    }

    // Getting active attempt with session data
    const attempt = await ExamAttempt.findOne({
      /* examId: examId, */
      examId,
      studentId: req.user.id,
      isActive: true,
      isCompleted: false
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "No active exam attempt found"
      });
    }

    // Check existing response for THIS SPECIFIC ATTEMPT
    const existingResponse = await Response.findOne({
      examAttemptId: attempt._id,
      questionId
    });

    if (existingResponse) {
      return res.status(400).json({ 
        success: false, 
        message: "Response already submitted for this attempt" 
      });
    }
    // Getting question details
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: "Question not found" 
      });
    }
    /* const exam = await ExamAttempt.findById(examId);
    if(exam.isNegativeMarking && !isCorrect){
      marksObtained = -question.marks * (exam.negativeMarkingPercentage / 100);
    } */

    // Auto-grading logic
    let isCorrect = null;
    let marksObtained = 0;
    
    if (question.isAutoGraded) {
      const correctOptions = question.options
        .map((opt, index) => opt.isCorrect ? index : -1)
        .filter(i => i !== -1);
      
      isCorrect = JSON.stringify(selectedOptions.sort()) === JSON.stringify(correctOptions.sort());
      marksObtained = isCorrect ? question.marks : 0;
      
      //applying negative marking
      if(!isCorrect && exam.isNegativeMarking){
        const negativeMarks = question.marks * (exam.negativeMarkingPercentage / 100);
        marksObtained -= negativeMarks;
      }
    }

    const timeSpent = Date.now() - start;

    //Creating response record
    const response = new Response({
      examAttemptId: attempt._id,
      examId,
      questionId,
      studentId: req.user.id,
      selectedOptions,
      isCorrect,
      marksObtained,
      timeSpent
    });

    await response.save();
// Log the activity
    await ExamLog.updateOne(
      { examId, studentId: req.user.id },
      { $push: { activityLog: {
          timestamp: new Date(),
          action: 'answered',
          questionId
        }
      }}
    );

    //Updating the analytics
    await updateExamAnalytics(examId);

    res.status(201).json({ 
      success: true, 
      message: "Response submitted successfully",
      response 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const gradeResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { marksObtained } = req.body;

    const response = await Response.findByIdAndUpdate(
      responseId,
      { marksObtained },
      { new: true }
    );

    if (!response) {
      return res.status(404).json({ 
        success: false, 
        message: "Response not found" 
      });
    }

    await Result.findOneAndUpdate(
      { examId: response.examId, studentId: response.studentId },
      { $inc: { marksObtained: marksObtained } }
    );

    const result = await Result.findOne({
      examId: response.examId,
      studentId: response.studentId
    });

    if (result && result.totalMarks > 0) {
      const newPercentage = (result.marksObtained / result.totalMarks) * 100;
      
      await Result.updateOne(
        { _id: result._id },
        { percentage: newPercentage }
      );
    }
    res.status(200).json({ 
      success: true, 
      message: "Response graded successfully",
      response 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Updated submitBatchResponses
export const submitBatchResponses = async (req, res) => {
  try {
    const { examId } = req.params;
    const { responses } = req.body;
    const studentId = req.user.id;

    // 1. Validate Active Attempt
    const attempt = await ExamAttempt.findOne({
      examId,
      studentId,
      isActive: true
    }).lean();

    if (!attempt) {
      return res.status(403).json({
        success: false,
        message: "No active exam attempt"
      });
    }

        // **ADD: Check if this is a grace period submission**
    const exam = await Exam.findById(examId).lean();
    const elapsedSeconds = (Date.now() - attempt.startTime) / 1000;
    const examDurationSeconds = exam.duration * 60;
    
    if (elapsedSeconds > examDurationSeconds) {
      console.log(`Grace period auto-submission detected:`, {
        attemptId: attempt._id,
        examId,
        studentId,
        overtimeSeconds: elapsedSeconds - examDurationSeconds,
        timestamp: new Date()
      });
    }

    // 2. Pre-Fetch Required Data
    const [questions] = await Promise.all([
      Question.find({ examId }).lean()
    ]);

    // 3. Precompute Grading Data using functional approach
    const gradedResponses = Object.entries(responses)
      .map(([qId, clientIndexes]) => {
        const question = questions.find(q => q._id.toString() === qId);
        if (!question) return null;

        // Get shuffle mapping from attempt (plain object access)
        const optionMap = attempt.optionOrder[qId];
        
        // Convert client indexes to original indexes with fallback
        const originalIndexes = clientIndexes
          .map(clientIdx => optionMap ? optionMap[clientIdx] : clientIdx)
          .sort();

        let isCorrect = false;
        let marks = 0;

        if (question.isAutoGraded) {
          // Get correct indexes from question
          const correctIndexes = question.options
            .map((opt, idx) => (opt.isCorrect ? idx : -1))
            .filter(i => i !== -1)
            .sort();

          // Strict equality check of sorted arrays
          isCorrect = JSON.stringify(originalIndexes) === JSON.stringify(correctIndexes);

          // Calculate marks with negative handling
          if (isCorrect) {
            marks = question.marks;
          } else if (exam.isNegativeMarking) {
            marks = -(question.marks * exam.negativeMarkingPercentage) / 100;
          }
        }

        return {
          qId,
          clientIndexes,
          originalIndexes,
          isCorrect: question.isAutoGraded ? isCorrect : null,
          marks
        };
      })
      .filter(Boolean);

    // Calculate total marks with non-negative enforcement
    let totalMarks = 0;
    gradedResponses.forEach(({ marks }) => {
      totalMarks = Math.max(totalMarks + marks, 0);
    });

    // 4. Prepare bulk operations
    const bulkOps = gradedResponses.map((response) => ({
      updateOne: {
        filter: {
          examAttemptId: attempt._id,
          questionId: response.qId
        },
        update: {
          $set: {
            selectedOptions: response.clientIndexes,
            originalSelectedOptions: response.originalIndexes,
            isCorrect: response.isCorrect,
            marksObtained: response.marks,
            submittedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    // 5. Prepare answer events
    const answerEvents = gradedResponses.map((response) => ({
      type: "answer",
      questionId: response.qId,
      timestamp: new Date(),
      metadata: { selectedOptions: response.clientIndexes }
    }));

    // 6. Execute Bulk Operation
    await Response.bulkWrite(bulkOps);

    // 7. Update Result Document (existing implementation)
    const percentage = Number(
      ((totalMarks / exam.totalMarks) * 100).toFixed(2)
    );

    const result = await Result.findOneAndUpdate(
      { examId, studentId },
      {
        $push: {
          allAttempts: {
            attemptId: attempt._id,
            percentage: percentage,
            marksObtained: totalMarks,
            totalMarks: exam.totalMarks,
            timestamp: new Date()
          }
        }
      },
      { new: true, upsert: true }
    );

    // 8. Find Best Attempt (existing implementation)
    let bestAttempt = result.allAttempts[0];
    for (const attempt of result.allAttempts) {
      if (attempt.percentage > bestAttempt.percentage) {
        bestAttempt = attempt;
      }
    }

    // 9. Update Final Result (existing implementation)
    const finalResult = await Result.findByIdAndUpdate(
      result._id,
      {
        marksObtained: bestAttempt.marksObtained,
        percentage: bestAttempt.percentage,
        isPassed: bestAttempt.percentage >= exam.passingPercentage,
        bestAttemptId: bestAttempt.attemptId,
        totalMarks: exam.totalMarks
      },
      { new: true }
    );

    // 10. Close Attempt (existing implementation)
    await ExamAttempt.findByIdAndUpdate(attempt._id, {
      isActive: false,
      isCompleted: true,
      $inc: { attemptCount: 1 },
      endTime: new Date()
    });

    // 11. Update analytics (existing implementation)
    await updateExamAnalytics(examId);

    // 12. Update Exam Log with all events (existing implementation)
    await ExamLog.updateOne(
      { examId, studentId, attemptId: attempt._id },
      {
        $push: {
          events: {
            $each: [
              ...answerEvents,
              { type: "complete", timestamp: new Date() }
            ]
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Exam submitted successfully",
      result: finalResult
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
