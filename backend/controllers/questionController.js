import Question from '../models/questionModel.js';
import Exam from '../models/examModel.js';
import ExamAttempt from '../models/examAttemptModel.js';
import userModel from '../models/userModel.js';
import {
  buildQuestionsAddedEmail,
  buildQuestionUpdatedEmail,
} from "../utils/emailTemplates.js";
import { sendSystemEmail } from "../utils/emailService.js";

export const addQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    const questionsData = Array.isArray(req.body) ? req.body : [req.body];

    // Validate all questions first
    const validationErrors = [];
    for (const [index, question] of questionsData.entries()) {
      if (!question.questionText || !question.questionType || 
          !question.options || !question.marks) {
        validationErrors.push(`Question ${index + 1}: All fields are required`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: validationErrors
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: "Exam not found" 
      });
    }

    // Create all questions
    const questions = await Question.insertMany(
      questionsData.map(qData => ({
        examId,
        questionText: qData.questionText,
        questionType: qData.questionType,
        options: qData.options,
        marks: qData.marks
      }))
    );

    // Update exam total marks once after bulk insert
    await updateExamTotalMarks(examId);

    try {
  const creator = await userModel.findById(req.user.id).select("firstName lastName email");
  const updatedExam = await Exam.findById(examId).select("title totalMarks status");

  if (creator?.email && updatedExam) {
    const totalNewMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const totalQuestions = await Question.countDocuments({ examId });

    const emailPayload = buildQuestionsAddedEmail({
      creatorName: `${creator.firstName} ${creator.lastName}`.trim(),
      examTitle: updatedExam.title,
      questionCount: questions.length,
      totalNewMarks,
      totalQuestions,
      totalMarks: updatedExam.totalMarks || 0,
      examStatus: updatedExam.status,
    });

    await sendSystemEmail({
      to: creator.email,
      subject: emailPayload.subject,
      html: emailPayload.html,
      category: "question_added",
    });
  }
} catch (emailError) {
  console.error("[Email] Questions added email failed:", emailError.message);
}

    res.status(201).json({ 
      success: true, 
      message: `${questions.length} questions added`,
      questions
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const updates = req.body;

    const question = await Question.findByIdAndUpdate(
      questionId,
      updates,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ 
      success: false, 
      message: "Question not found" 
      });
    }

    await question.save();
    await updateExamTotalMarks(question.examId);

    try {
  const creator = await userModel.findById(req.user.id).select("firstName lastName email");
  const exam = await Exam.findById(question.examId).select("title");

  if (creator?.email && exam) {
    const emailPayload = buildQuestionUpdatedEmail({
      creatorName: `${creator.firstName} ${creator.lastName}`.trim(),
      examTitle: exam.title,
      questionType: question.questionType,
      marks: question.marks,
      questionText: question.questionText,
    });

    await sendSystemEmail({
      to: creator.email,
      subject: emailPayload.subject,
      html: emailPayload.html,
      category: "question_updated",
    });
  }
} catch (emailError) {
  console.error("[Email] Question updated email failed:", emailError.message);
}

    res.status(200).json({ 
      success: true, 
      message: "Question updated successfully",
      question 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByIdAndDelete(questionId);
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: "Question not found" 
      });
    }

    // Update exam's total marks after deletion
    await updateExamTotalMarks(question.examId);

    res.status(200).json({ 
      success: true, 
      message: "Question deleted successfully",
      deletedQuestion: question
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getExamQuestions = async (req, res) => {
  try {
    // 1. Get active attempt with proper population
    const attempt = await ExamAttempt.findOne({
      examId: req.params.examId,
      studentId: req.user.id,
      isActive: true
    }).lean();

    /* Shifted to middleware
    if (!attempt) {
      return res.status(403).json({
        success: false,
        message: "Start your exam attempt first"
      });
    } */

    // 2. Convert optionOrder Map from stored object
    const optionOrderMap = new Map(
      Object.entries(attempt.optionOrder).map(([k, v]) => [k.toString(), v])
    );

    // 3. Get all questions in database order first
    const questions = await Question.find({ examId: req.params.examId })
      .select('-options.isCorrect -__v')
      .lean();
      
      if (!questions.length) {
        return res.status(404).json({ 
          success: false, 
          message: "No questions found for this exam" 
        });
      }
    // 4. Apply question ordering from attempt
    const orderedQuestions = attempt.questionOrder.map(id => 
      questions.find(q => q._id.equals(id))
    ).filter(q => q); // Remove undefined in case of deleted questions

    // 5. Apply option shuffling using converted Map
    const shuffledQuestions = orderedQuestions.map(q => {
      const optionIndices = optionOrderMap.get(q._id.toString()) || [];
      return {
        ...q,
        options: optionIndices.map(origIdx => q.options[origIdx])
      };
    });

    res.status(200).json({ 
      success: true, 
      questions: shuffledQuestions 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get questions for management (without requiring active exam)
export const getExamQuestionsForManagement = async (req, res) => {
  try {
    const { examId } = req.params;

    // Get all questions for this exam in original order (no shuffling)
    const questions = await Question.find({ examId })
      .sort('createdAt') // Original creation order
      .lean();

    res.status(200).json({
      success: true,
      questions: questions || []
    });

  } catch (error) {
    console.error('Error fetching questions for management:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete individual question
export const deleteIndividualQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findByIdAndDelete(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    // Update exam's total marks after deletion
    await updateExamTotalMarks(question.examId);

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      deletedQuestion: question
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update individual question
export const updateIndividualQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    // Get original question before updating
    const originalQuestion = await Question.findById(questionId).populate('examId');
    if (!originalQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    const updates = req.body;
    
    // **NEW: Check if there are actual changes**
    const hasActualChanges = (
      originalQuestion.questionText !== updates.questionText ||
      originalQuestion.questionType !== updates.questionType ||
      originalQuestion.marks !== updates.marks ||
      originalQuestion.explanation !== (updates.explanation || '') ||
      JSON.stringify(originalQuestion.options) !== JSON.stringify(updates.options)
    );

    // **NEW: If no changes, return early without sending email**
    if (!hasActualChanges) {
      console.log(`No changes detected for question ${questionId}, skipping update and email`);
      return res.status(200).json({
        success: true,
        message: "Question is already up to date",
        question: originalQuestion,
        noChanges: true
      });
    }

    const question = await Question.findByIdAndUpdate(
      questionId,
      {
        questionText: updates.questionText,
        questionType: updates.questionType,
        options: updates.options,
        marks: updates.marks,
        explanation: updates.explanation || ''
      },
      { new: true, runValidators: true }
    ).populate('examId');

    await updateExamTotalMarks(question.examId._id);

    // **UPDATED: Only send email when actual changes were made**
    try {
      // Get user details for email
      const creator = await userModel.findById(req.user.id).select('firstName lastName email');
      
      // **FIXED: Proper timezone conversion function**
      const formatDateTimeIST = (utcDate) => {
        return new Date(utcDate).toLocaleString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        });
      };

      // Helper to clean question text
      const cleanQuestionText = (htmlText, maxLength = 100) => {
        const cleanText = htmlText.replace(/<[^>]*>/g, '').trim();
        return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
      };

      // **IMPROVED: Detect specific changes made**
      const changes = [];
      if (originalQuestion.questionText !== question.questionText) {
        changes.push('Question Text');
      }
      if (originalQuestion.questionType !== question.questionType) {
        changes.push(`Type: ${originalQuestion.questionType.toUpperCase()} → ${question.questionType.toUpperCase()}`);
      }
      if (originalQuestion.marks !== question.marks) {
        changes.push(`Marks: ${originalQuestion.marks} → ${question.marks}`);
      }
      if (JSON.stringify(originalQuestion.options) !== JSON.stringify(question.options)) {
        changes.push('Answer Options');
      }
      if (originalQuestion.explanation !== question.explanation) {
        changes.push('Explanation');
      }

      console.log(`Sending email for question ${questionId} with changes:`, changes);

      const mailOptions = {
        from: process.env.SENDER_MAIL,
        to: creator.email,
        subject: `📝 Question Updated Successfully - ${question.examId.title}`,
        html: `
          <!-- Your existing email template with the changes array -->
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-family: 'Arial', sans-serif;">
            <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 COGNITO</h1>
              <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Question Management System</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">
                Hi <strong>${creator.firstName}</strong>,
              </h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Your question has been updated successfully with the following changes:
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 5px; text-align: center;">
                <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 20px;">📝 QUESTION UPDATED</h3>
                <p style="color: #92400e; margin: 0; font-weight: bold;">${question.questionType.toUpperCase()} • ${question.marks} marks</p>
              </div>
              
              <div style="background-color: #fff7ed; border-left: 4px solid #fb923c; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="color: #c2410c; margin: 0 0 15px 0; font-size: 18px;">🔄 Changes Made</h3>
                <ul style="color: #9a3412; margin: 0; padding-left: 20px;">
                  ${changes.map(change => `<li style="margin-bottom: 5px;">${change}</li>`).join('')}
                </ul>
              </div>
              
              <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 20px;">📋 Question Details</h3>
                
                <div style="background-color: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px;">
                  <p style="margin: 0 0 10px; color: #2d3748; font-weight: bold;">Question:</p>
                  <p style="margin: 0 0 15px; color: #4a5568; font-size: 14px; line-height: 1.5;">${cleanQuestionText(question.questionText, 200)}</p>
                  
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 5px 0; color: #4a5568; font-weight: bold; width: 30%;">Type:</td>
                      <td style="padding: 5px 0; color: #2d3748;">${question.questionType.toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #4a5568; font-weight: bold;">Marks:</td>
                      <td style="padding: 5px 0; color: #2d3748; font-weight: bold;">${question.marks}</td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #4a5568; font-weight: bold;">Updated:</td>
                      <td style="padding: 5px 0; color: #2d3748;">${formatDateTimeIST(new Date())} IST</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <p style="color: #2d3748; font-size: 16px; margin-top: 30px;">
                Best regards,<br>
                The <strong>COGNITO Team</strong>
              </p>
            </div>
            
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 10px 0 0; color: #a0aec0; font-size: 10px;">
                © 2025 COGNITO. All Rights Reserved.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Question update notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send question update notification:', emailError);
    }

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question,
      changesDetected: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateExamTotalMarks = async (examId) => {
    try {
      const questions = await Question.find({ examId });
      const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
      
      await Exam.findByIdAndUpdate(examId, { 
        totalMarks 
      }, { new: true, runValidators: true });
  
    } catch (error) {
      console.error("Error updating exam total marks:", error.message);
    }
}; 