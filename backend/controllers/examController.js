import Exam from '../models/examModel.js';
import ExamAttempt from '../models/examAttemptModel.js';
import Question from '../models/questionModel.js';
import Response from '../models/responseModel.js';
import Result from '../models/resultModel.js';
import ExamLog from '../models/examLogModel.js';
import Analytics from '../models/analyticsModel.js';
import transporter from '../config/nodemailer.js';
import userModel from '../models/userModel.js';

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
    
    // **FIXED: Email notification with proper timezone conversion**
    try {
      // Get user details for email
      const creator = await userModel.findById(req.user.id).select('firstName lastName email');
      
      // **FIXED: Correct timezone conversion function**
      const formatDateTimeIST = (utcDate) => {
        if (!utcDate) return 'Not specified';
        
        // Use only JavaScript's built-in timezone conversion - NO manual calculation
        return new Date(utcDate).toLocaleString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'  // Let JavaScript handle the conversion
        });
      };

      const mailOptions = {
        from: process.env.SENDER_MAIL,
        to: creator.email,
        subject: `✅ Exam Created Successfully - ${title}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-family: 'Arial', sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 COGNITO</h1>
              <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Exam Management System</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">
                Hi <strong>${creator.firstName}</strong>,
              </h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Congratulations! Your exam has been created successfully. Here are the details:
              </p>
              
              <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 20px;">📝 Exam Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold; width: 40%;">Title:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${title}</td>
                  </tr>
                  ${description ? `
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold; vertical-align: top;">Description:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${description.replace(/<[^>]*>/g, '').substring(0, 150)}${description.length > 150 ? '...' : ''}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Start Time:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">${formatDateTimeIST(startTimeUTC)} IST</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">End Time:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">${formatDateTimeIST(endTimeUTC)} IST</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Duration:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${duration} minutes</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Max Attempts:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${maxAttempts === 0 ? 'Unlimited' : maxAttempts}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Question Shuffling:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${isShuffleQuestions ? '✅ Enabled' : '❌ Disabled'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Negative Marking:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${isNegativeMarking ? `✅ ${negativeMarkingPercentage}% penalty` : '❌ Disabled'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Status:</td>
                    <td style="padding: 8px 0; color: #e53e3e; font-weight: bold;">📝 DRAFT</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #e6fffa; border: 1px solid #4fd1c7; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <p style="color: #234e52; margin: 0; font-size: 14px;">
                  <strong>📌 Next Steps:</strong><br>
                  • Add questions to your exam<br>
                  • Review exam settings<br>
                  • Publish when ready for students
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Your exam is currently in <strong>DRAFT</strong> status. Don't forget to publish it when you're ready!
              </p>
              
              <p style="color: #4a5568; font-size: 14px; line-height: 1.6;">
                If you have any questions, feel free to reach out to our support team at 
                <a href="mailto:help.cognito@gmail.com" style="color: #4299e1;">help.cognito@gmail.com</a>.
              </p>
              
              <p style="color: #2d3748; font-size: 16px; margin-top: 30px;">
                Best regards,<br>
                The <strong>COGNITO Team</strong>
              </p>
            </div>
            
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px;">
                Follow us on 
                <a href="#" style="color: #4299e1; text-decoration: none;">LinkedIn</a> | 
                <a href="#" style="color: #4299e1; text-decoration: none;">Twitter</a> | 
                <a href="#" style="color: #4299e1; text-decoration: none;">Facebook</a>
              </p>
              <p style="margin: 10px 0 0; color: #a0aec0; font-size: 10px;">
                © 2025 COGNITO. All Rights Reserved.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Exam creation notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send exam creation notification:', emailError);
      // Don't fail the exam creation if email fails
    }

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
    
    // Get the original exam before updating
    const originalExam = await Exam.findById(req.params.examId);
    if (!originalExam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

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

    //Recording updated exam details in the database
    await exam.save();

    // **NEW: Send email notification for exam update**
    try {
      // Get user details for email
      const creator = await userModel.findById(req.user.id).select('firstName lastName email');
      
      // **FIXED: Proper timezone conversion function**
      const formatDateTimeIST = (utcDate) => {
        if (!utcDate) return 'Not specified';
        
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

      // Detect what was changed
      const changes = [];
      if (originalExam.title !== exam.title) {
        changes.push(`Title: "${originalExam.title}" → "${exam.title}"`);
      }
      if (originalExam.description !== exam.description) {
        changes.push(`Description: Updated`);
      }
      if (originalExam.startTime.getTime() !== exam.startTime.getTime()) {
        changes.push(`Start Time: ${formatDateTimeIST(originalExam.startTime)} → ${formatDateTimeIST(exam.startTime)}`);
      }
      if (originalExam.endTime.getTime() !== exam.endTime.getTime()) {
        changes.push(`End Time: ${formatDateTimeIST(originalExam.endTime)} → ${formatDateTimeIST(exam.endTime)}`);
      }
      if (originalExam.duration !== exam.duration) {
        changes.push(`Duration: ${originalExam.duration} minutes → ${exam.duration} minutes`);
      }
      if (originalExam.maxAttempts !== exam.maxAttempts) {
        changes.push(`Max Attempts: ${originalExam.maxAttempts === 0 ? 'Unlimited' : originalExam.maxAttempts} → ${exam.maxAttempts === 0 ? 'Unlimited' : exam.maxAttempts}`);
      }
      if (originalExam.isShuffleQuestions !== exam.isShuffleQuestions) {
        changes.push(`Question Shuffling: ${originalExam.isShuffleQuestions ? 'Enabled' : 'Disabled'} → ${exam.isShuffleQuestions ? 'Enabled' : 'Disabled'}`);
      }
      if (originalExam.isNegativeMarking !== exam.isNegativeMarking) {
        changes.push(`Negative Marking: ${originalExam.isNegativeMarking ? 'Enabled' : 'Disabled'} → ${exam.isNegativeMarking ? 'Enabled' : 'Disabled'}`);
      }
      if (originalExam.negativeMarkingPercentage !== exam.negativeMarkingPercentage) {
        changes.push(`Negative Marking %: ${originalExam.negativeMarkingPercentage}% → ${exam.negativeMarkingPercentage}%`);
      }
      if (originalExam.instructions !== exam.instructions) {
        changes.push(`Instructions: Updated`);
      }

      const mailOptions = {
        from: process.env.SENDER_MAIL,
        to: creator.email,
        subject: `📝 Exam Updated Successfully - ${exam.title}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-family: 'Arial', sans-serif;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 COGNITO</h1>
              <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Exam Management System</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">
                Hi <strong>${creator.firstName}</strong>,
              </h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Your exam has been updated successfully! Here are the current details and changes made:
              </p>
              
              ${changes.length > 0 ? `
              <div style="background-color: #fff5f5; border-left: 4px solid #f56565; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="color: #c53030; margin: 0 0 15px 0; font-size: 18px;">🔄 Changes Made</h3>
                <ul style="color: #744210; margin: 0; padding-left: 20px;">
                  ${changes.map(change => `<li style="margin-bottom: 8px;">${change}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 20px;">📝 Current Exam Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold; width: 40%;">Title:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${exam.title}</td>
                  </tr>
                  ${exam.description ? `
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold; vertical-align: top;">Description:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${exam.description.replace(/<[^>]*>/g, '').substring(0, 150)}${exam.description.length > 150 ? '...' : ''}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Start Time:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">${formatDateTimeIST(exam.startTime)} IST</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">End Time:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">${formatDateTimeIST(exam.endTime)} IST</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Duration:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${exam.duration} minutes</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Max Attempts:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${exam.maxAttempts === 0 ? 'Unlimited' : exam.maxAttempts}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Question Shuffling:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${exam.isShuffleQuestions ? '✅ Enabled' : '❌ Disabled'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Negative Marking:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${exam.isNegativeMarking ? `✅ ${exam.negativeMarkingPercentage}% penalty` : '❌ Disabled'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Status:</td>
                    <td style="padding: 8px 0; color: ${exam.status === 'published' ? '#38a169' : '#e53e3e'}; font-weight: bold;">
                      ${exam.status === 'published' ? '🟢 PUBLISHED' : '📝 DRAFT'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Last Updated:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">${formatDateTimeIST(new Date())} IST</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #e6fffa; border: 1px solid #4fd1c7; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <p style="color: #234e52; margin: 0; font-size: 14px; text-align: center;">
                  <strong>💡 Remember:</strong> Changes will take effect immediately for new attempts. 
                  Active exam sessions will continue with the previous settings.
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 14px; line-height: 1.6;">
                If you have any questions, feel free to reach out to our support team at 
                <a href="mailto:help.cognito@gmail.com" style="color: #4299e1;">help.cognito@gmail.com</a>.
              </p>
              
              <p style="color: #2d3748; font-size: 16px; margin-top: 30px;">
                Best regards,<br>
                The <strong>COGNITO Team</strong>
              </p>
            </div>
            
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px;">
                Follow us on 
                <a href="#" style="color: #4299e1; text-decoration: none;">LinkedIn</a> | 
                <a href="#" style="color: #4299e1; text-decoration: none;">Twitter</a> | 
                <a href="#" style="color: #4299e1; text-decoration: none;">Facebook</a>
              </p>
              <p style="margin: 10px 0 0; color: #a0aec0; font-size: 10px;">
                © 2025 COGNITO. All Rights Reserved.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Exam update notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send exam update notification:', emailError);
      // Don't fail the update if email fails
    }

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

     // Get creator details for email
    const creator = await userModel.findById(req.user.id).select('firstName lastName email');

    // Count related data before deletion
    const [questionsCount, attemptsCount, responsesCount] = await Promise.all([
      Question.countDocuments({ examId: req.params.examId }),
      ExamAttempt.countDocuments({ examId: req.params.examId }),
      Response.countDocuments({ examId: req.params.examId })
    ]);

    // Delete the exam
    await Exam.findByIdAndDelete(req.params.examId);

    // Cleanup related data
    await Promise.all([
      ExamAttempt.deleteMany({ examId: req.params.examId }),
      Question.deleteMany({ examId: req.params.examId }),
      Response.deleteMany({ examId: req.params.examId }),
      Result.deleteMany({ examId: req.params.examId }),
      ExamLog.deleteMany({ examId: req.params.examId }),
      Analytics.deleteMany({ examId: req.params.examId })
    ]);

    // **NEW: Send deletion confirmation email**
    try {
      // **FIXED: Proper timezone conversion function**
      const formatDateTimeIST = (utcDate) => {
        if (!utcDate) return 'Not specified';
        
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

      const mailOptions = {
        from: process.env.SENDER_MAIL,
        to: creator.email,
        subject: `🗑️ Exam Deleted Successfully - ${exam.title}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-family: 'Arial', sans-serif;">
            <div style="background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 COGNITO</h1>
              <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Exam Management System</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 24px;">
                Hi <strong>${creator.firstName}</strong>,
              </h2>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                This email confirms that your exam has been permanently deleted from the COGNITO system.
              </p>
              
              <div style="background-color: #fed7d7; border-left: 4px solid #e53e3e; padding: 20px; margin: 25px 0; border-radius: 5px; text-align: center;">
                <h3 style="color: #c53030; margin: 0 0 10px 0; font-size: 20px;">🗑️ EXAM DELETED</h3>
                <p style="color: #c53030; margin: 0; font-weight: bold; font-size: 16px;">This action cannot be undone</p>
              </div>
              
              <div style="background-color: #f7fafc; border-left: 4px solid #718096; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 20px;">📋 Deleted Exam Details</h3>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold; width: 40%;">Title:</td>
                    <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">${exam.title}</td>
                  </tr>
                  ${exam.description ? `
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold; vertical-align: top;">Description:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${exam.description.replace(/<[^>]*>/g, '').substring(0, 150)}${exam.description.length > 150 ? '...' : ''}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Start Time:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${formatDateTimeIST(exam.startTime)} IST</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">End Time:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${formatDateTimeIST(exam.endTime)} IST</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Duration:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${exam.duration} minutes</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Status:</td>
                    <td style="padding: 8px 0; color: ${exam.status === 'published' ? '#38a169' : '#e53e3e'};">
                      ${exam.status === 'published' ? '🟢 Was Published' : '📝 Was Draft'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Created On:</td>
                    <td style="padding: 8px 0; color: #2d3748;">${formatDateTimeIST(exam.createdAt)} IST</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #4a5568; font-weight: bold;">Deleted On:</td>
                    <td style="padding: 8px 0; color: #e53e3e; font-weight: bold;">${formatDateTimeIST(new Date())} IST</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #fefcbf; border-left: 4px solid #f6ad55; padding: 20px; margin: 25px 0; border-radius: 5px;">
                <h3 style="color: #c05621; margin: 0 0 15px 0; font-size: 18px;">📊 Data Summary</h3>
                <p style="color: #744210; margin: 0; font-size: 14px;">
                  The following associated data has also been permanently removed:
                </p>
                <ul style="color: #744210; margin: 10px 0 0; padding-left: 20px;">
                  <li><strong>${questionsCount}</strong> questions</li>
                  <li><strong>${attemptsCount}</strong> student attempts</li>
                  <li><strong>${responsesCount}</strong> student responses</li>
                  <li>All results and analytics</li>
                  <li>All activity logs</li>
                </ul>
              </div>
              
              <div style="background-color: #e6fffa; border: 1px solid #4fd1c7; padding: 20px; margin: 25px 0; border-radius: 8px;">
                <p style="color: #234e52; margin: 0; font-size: 14px; text-align: center;">
                  <strong>⚠️ Important:</strong> This deletion is permanent and cannot be reversed. 
                  If you need this exam again, you'll need to recreate it from scratch.
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                If this deletion was done by mistake or if you have any questions, please contact our support team immediately at 
                <a href="mailto:help.cognito@gmail.com" style="color: #4299e1;">help.cognito@gmail.com</a>.
              </p>
              
              <p style="color: #2d3748; font-size: 16px; margin-top: 30px;">
                Best regards,<br>
                The <strong>COGNITO Team</strong>
              </p>
            </div>
            
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #718096; font-size: 12px;">
                Follow us on 
                <a href="#" style="color: #4299e1; text-decoration: none;">LinkedIn</a> | 
                <a href="#" style="color: #4299e1; text-decoration: none;">Twitter</a> | 
                <a href="#" style="color: #4299e1; text-decoration: none;">Facebook</a>
              </p>
              <p style="margin: 10px 0 0; color: #a0aec0; font-size: 10px;">
                © 2025 COGNITO. All Rights Reserved.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Exam deletion notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send exam deletion notification:', emailError);
      // Don't fail the deletion if email fails
    }

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