import Question from '../models/questionModel.js';
import Exam from '../models/examModel.js';



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
// Add the deleteFunction
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
    const questions = await Question.find({ examId: req.params.examId })
      .select('-correctOptions -__v')
      .lean();

    if (!questions.length) {
      return res.status(404).json({ 
        success: false, 
        message: "No questions found for this exam" 
      });
    }

    // Shuffle questions and options
    const shuffledQuestions = questions
      .sort(() => Math.random() - 0.5)
      .map(q => ({
        ...q,
        options: q.options.sort(() => Math.random() - 0.5)
      }));
      
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
  // Add this function
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