import Exam from '../models/examModel.js';
import ExamAttempt from '../models/examAttemptModel.js';
import Question from '../models/questionModel.js';
import Response from '../models/responseModel.js';
import Result from '../models/resultModel.js';
import ExamLog from '../models/examLogModel.js';
import Analytics from '../models/analyticsModel.js';

// FIXED: Helper function to get current IST time
const getCurrentIST = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime;
};

// FIXED: Helper function to convert UTC to IST for filtering
const convertUTCToIST = (utcDate) => {
  if (!utcDate) return null;
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate;
};

// Helper function for pagination logic
const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || '-createdAt';
  const searchQuery = req.query.search || '';
  const skip = (page - 1) * limit;
  
  return { page, limit, sortBy, searchQuery, skip };
};

// Helper function to build search filter
const buildSearchFilter = (searchQuery, baseFilter = {}) => {
  const filter = { ...baseFilter };
  
  if (searchQuery) {
    filter.title = {
      $regex: searchQuery,
      $options: 'i' // Case-insensitive
    };
  }
  
  return filter;
};

export const createExam = async (req, res) => {
  try {
    const { title, description, startTime, endTime, duration, maxAttempts, isShuffleQuestions, isNegativeMarking, negativeMarkingPercentage, instructions, timezone } = req.body;

    if (!title || !startTime || !endTime || !duration) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, start time, end time, and duration are required" 
      });
    }
    // FIXED: Proper timezone validation
    const startTimeUTC = new Date(startTime);
    const endTimeUTC = new Date(endTime);
    const currentTimeUTC = new Date();

    if (startTimeUTC < currentTimeUTC) {
      return res.status(400).json({ 
        success: false, 
        message: "Start time must be in the future" 
      });
    }else if (endTimeUTC <= startTimeUTC) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time"
      });
    }else if (duration < 1) {
      return res.status(400).json({
        success: false,
        message: "Duration must be at least 1 minute"
      });  
    } 
    const newExam = new Exam({
      title,
      description,
      startTime: startTimeUTC,
      endTime: endTimeUTC,
      duration,
      maxAttempts,
      isShuffleQuestions, 
      isNegativeMarking, 
      negativeMarkingPercentage,
      instructions,
      timezone: timezone || 'Asia/Kolkata', // Default to IST if not provided
      createdBy: req.user.id
    });

    await newExam.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Exam created successfully",
      exam: newExam 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const updateExam = async (req, res) => {
  try {
    
    const updates = { ...req.body };
    
    // If startTime or endTime is provided, ensure they're properly handled
    if (updates.startTime) {
      updates.startTime = new Date(updates.startTime);
    }
    if (updates.endTime) {
      updates.endTime = new Date(updates.endTime);
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.examId,
      updates,
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: "Exam not found" 
      });
    }
    //Recording updated exam details in the database
    await exam.save();

    res.status(200).json({ 
      success: true, 
      message: "Exam updated successfully",
      exam 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const publishExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.examId,
      { status: 'published' },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: "Exam not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Exam published successfully",
      exam 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const unpublishExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.examId,
      { status: 'draft' },
      { new: true }
    );

    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    
    res.json({ 
      success: true,
      message: 'Exam set to draft successfully',
      exam 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Complete publish/unpublish handler
export const toggleExamStatus = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const newStatus = req.path.includes('publish') ? 'published' : 'draft';
    exam.status = newStatus;
    await exam.save();

    res.json({
      success: true,
      message: `Exam ${newStatus} successfully`,
      exam
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// FIXED: List Active Exams with proper pagination (Student)
export const listActiveExams = async (req, res) => {
  try {
    const { page, limit, sortBy, searchQuery, skip } = getPaginationParams(req);

    const currentTimeUTC = new Date();

    // Base query for active exams - comparing UTC times
    const baseQuery = {
      status: 'published',
      startTime: { $lte: currentTimeUTC },
      endTime: { $gt: currentTimeUTC }  // Changed to $gt instead of $gte
    };

    const filter = buildSearchFilter(searchQuery, baseQuery);

    // Get paginated results and total count
    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      Exam.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      exams,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.examId);

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: "Exam not found" 
      });
    }

    // Cleanup related data
    await Promise.all([
      ExamAttempt.deleteMany({ examId: req.params.examId }),
      Question.deleteMany({ examId: req.params.examId }),
      Response.deleteMany({ examId: req.params.examId }),
      Result.deleteMany({ examId: req.params.examId }),
      ExamLog.deleteMany({ examId: req.params.examId }),
      Analytics.deleteMany({ examId: req.params.examId })
    ]);

    res.status(200).json({ 
      success: true, 
      message: "Exam deleted successfully" 
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
    const questions = await Question.find({ examId: req.params.examId });
    
    // Shuffle questions
    const shuffledQuestions = questions
      .map(q => ({...q._doc, options: shuffleArray(q.options)}))
      .sort(() => Math.random() - 0.5);

    res.status(200).json({ 
      success: true, 
      questions: shuffledQuestions 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
//Helper Function
const shuffleArray = (array) => {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

export const startExamAttempt = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    // Get exam and questions
    const [exam, questions] = await Promise.all([
      Exam.findById(examId),
      Question.find({ examId }).select('_id options').lean()
    ]);
    // check for active attempt status
    const existingAttempt = await ExamAttempt.findOne({
      examId,
      studentId,
      isActive: true,
      isCompleted: false
    })
    if (existingAttempt) {
      return res.status(200).json({
        success: true,
        message: "Resuming existing attempt",
        attempt: existingAttempt
      });
    }
    if (!exam || !questions.length) {
      return res.status(404).json({
        success: false,
        message: "Exam or questions not found"
      });
    }

    // Generate shuffle mappings
    const questionOrder = exam.isShuffleQuestions 
      ? shuffleArray(questions.map(q => q._id))
      : questions.map(q => q._id);

      const optionOrder = questions.reduce((acc, question) => {
        const qId = question._id.toString();
        acc[qId] = exam.isShuffleQuestions 
          ? shuffleArray([...Array(question.options.length).keys()])
          : [...Array(question.options.length).keys()];
        return acc;
      }, {});
      console.log('[DEBUG] Generated Option Order:', JSON.stringify(optionOrder, null, 2));
    // Create new attempt
    const attempt = new ExamAttempt({
      examId,
      studentId,
      questionOrder,
      optionOrder: new Map(  // Convert to proper Map
        Object.entries(optionOrder).map(([k,v]) => [k.toString(), v])
      ),
      startTime: new Date(),
      duration: exam.duration * 60
    });
    console.log('[DEBUG] ExamAttempt Document:', JSON.stringify(attempt, null, 2));

    await attempt.save();

    // Create exam log with start event
    const examLog = new ExamLog({
      examId,
      studentId: req.user.id,
      attemptId: attempt._id,
      events: [{
        type: 'start',
        timestamp: new Date()
      }]
    });
    await examLog.save();

    res.status(201).json({
      success: true,
      message: "Exam attempt started",
      attemptId: attempt._id
    });

  } catch (error) {
    if(error.code === 11000){
      const existing = await ExamAttempt.findOne({
        examId: req.params.examId,
        studentId: req.user.id
      }).sort({ createdAt: -1 });
    }
    res.status(200).json({
      success: true,
      message: "Resuming latest attempt",
      attempt: existing
    });
  }
};

export const completeExamAttempt = async (req, res) => {
  try {
    const { examId } = req.params;

    const attempt = await ExamAttempt.findOneAndUpdate(
      { 
        examId: examId,
        studentId: req.user.id,
        isActive: true,
        isCompleted: false 
      },
      { 
        $set: { isCompleted: true, isActive: false },
        $inc: { attemptCount: 1 } 
      },
      { new: true }
    );

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "No active attempt found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Exam attempt completed",
      attempt
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// FIXED: Get My Exams with pagination (Faculty)
export const getMyExams = async (req, res) => {
  try {
    const { page, limit, sortBy, searchQuery, skip } = getPaginationParams(req);

    const baseQuery = { 
      $or: [
        { createdBy: req.user.id },
        { creatorId: req.user.id }
      ]
    };

    const filter = buildSearchFilter(searchQuery, baseQuery);

    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      Exam.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      exams,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// FIXED: Get All Exams with pagination (Admin)
export const getAllExams = async (req, res) => {
  try {
    const { page, limit, sortBy, searchQuery, skip } = getPaginationParams(req);

    const filter = buildSearchFilter(searchQuery);

    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      Exam.countDocuments(filter)
    ]);

    // Process exams to ensure consistent creator info
    const processedExams = exams.map(exam => {
      if (exam.createdBy && !exam.creatorId) {
        exam.creatorId = typeof exam.createdBy === 'object' ? exam.createdBy._id : exam.createdBy;
      }
      return exam;
    });

    res.status(200).json({
      success: true,
      exams: processedExams,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};