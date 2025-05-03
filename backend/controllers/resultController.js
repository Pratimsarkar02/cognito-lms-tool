import Result from '../models/resultModel.js';
import Exam from '../models/examModel.js';
import Response from '../models/responseModel.js';
import ExamAttempt from '../models/examAttemptModel.js';
import { Parser } from 'json2csv';

export const generateResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).lean(); // Critical fix

    // Get all students who attempted
    const studentIds = await ExamAttempt.find({ examId })
      .distinct('studentId');

    const results = await Promise.all(
      studentIds.map(async (studentId) => {
        const result = await Result.findOne({ examId, studentId })
          .populate('allAttempts.attemptId');

        if (!result?.allAttempts?.length) return null;

        // Find best attempt
        let bestAttempt = result.allAttempts[0];
        for (const attempt of result.allAttempts) {
          if (attempt.percentage > bestAttempt.percentage) {
            bestAttempt = attempt;
          }
        }

        // Update with best attempt data
        return Result.findByIdAndUpdate(
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
      })
    );

    res.status(200).json({
      success: true,
      message: `${results.length} results generated`,
      results: results.filter(r => r !== null)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getStudentResult = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.role === 'Student' ? req.user.id : req.query.studentId;

    const result = await Result.find({ examId, studentId })
      .populate('examId', 'title')
      .populate('studentId', 'firstName lastName');

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: "Result not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      result 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const exportExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    
    const results = await Result.find({ examId })
    .populate('studentId', 'firstName lastName email')
    .populate('examId', 'title totalMarks')
    .lean();

    const csvFields = [
      { label: 'Student Name', value: row => `${row.studentId.firstName} ${row.studentId.lastName}` },
      { label: 'Email', value: 'studentId.email' },
      { label: 'Exam Title', value: 'examId.title' },
      { label: 'Total Marks', value: 'totalMarks' },
      { label: 'Marks Obtained', value: 'marksObtained' },
      { label: 'Percentage', value: row => `${row.percentage.toFixed(2)}%` },
      { label: 'Is Passed', value: row => (row.isPassed ? 'Yes' : 'No') }
    ];

    const csvParser = new Parser({ fields: csvFields });
    const csvData = csvParser.parse(results);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=exam-${examId}-results.csv`);
    res.status(200).send(csvData);

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getResults = async (req, res) => {
  try {
    const results = await Result.find({ examId: req.params.examId })
      .populate({
        path: 'studentId',
        select: 'firstName lastName email',
        model: 'user-details'
      })
      .populate({
        path: 'bestAttemptId',
        select: 'startTime endTime',
        model: 'ExamAttempt'
      });

    // Validate results
    const validatedResults = results.map(result => ({
      ...result.toObject(),
      percentage: Number(result.percentage.toFixed(2)),
      isPassed: result.percentage >= 40 // Ensure passing criteria match
    }));

    res.status(200).json({
      success: true,
      results: validatedResults
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};