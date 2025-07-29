import Question from '../models/questionModel.js';
import Exam from '../models/examModel.js';
import ExamAttempt from '../models/examAttemptModel.js';


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
    const updates = req.body;

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
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    await updateExamTotalMarks(question.examId);

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