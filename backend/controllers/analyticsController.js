import mongoose from 'mongoose';
import Analytics from '../models/analyticsModel.js';
import ExamLog from '../models/examLogModel.js';
import Result from '../models/resultModel.js';
import Response from '../models/responseModel.js';
import ExamAttempt from '../models/examAttemptModel.js';
import Exam from '../models/examModel.js';
import Question from '../models/questionModel.js';
import { populate } from 'dotenv';

// Controller to update exam analytics
export const updateExamAnalytics = async (examId) => {
  try {
    // 1. Fetch all required data (ADDED EXAM LOGS)
    const [results, responses, questions, exam, logs] = await Promise.all([
      Result.find({ examId }).lean(),
      Response.find({ examId }).lean(),
      Question.find({ examId }).lean(),
      Exam.findById(examId).lean(),
      ExamLog.find({ examId }).lean() // ADDED LOGS FETCH
    ]);
    // 2. Calculate participation metrics (hourly and daily)
    const participation = {
      hourly: calculateHourlyParticipation(logs),
      daily: calculateDailyParticipation(logs)
    };
    // 3. Calculate pass percentage (unique students)
    const uniqueStudents = [...new Set(results.map(r => r.studentId.toString()))];
    const passedStudents = results.filter(r => r.isPassed).length;
    const passPercentage = uniqueStudents.length > 0 
      ? Number(((passedStudents / uniqueStudents.length) * 100).toFixed(2))
      : 0;

    // 4. Score distribution with capped ranges
    const distribution = results.reduce((acc, result) => {
      let rangeStart = Math.floor(result.percentage / 25) * 25;
      rangeStart = Math.min(rangeStart, 75); // Cap at 75-100%
      const rangeKey = `${rangeStart}-${rangeStart + 25}%`;
      
      acc[rangeKey] = (acc[rangeKey] || 0) + 1;
      return acc;
    }, {});

    // 5. Question statistics with proper counting
    const questionStats = questions.map(question => {
      // Convert to string for reliable comparison
      const questionIdStr = question._id.toString();
      
      const questionResponses = responses.filter(r => 
        r.questionId?.toString() === questionIdStr // Added null check
      );
    
      // Count only truly correct answers (exclude null/undefined)
      const correct = questionResponses.filter(r => 
        r.isCorrect === true
      ).length;
    
      return {
        questionId: question._id,
        correctAttempts: correct,
        totalAttempts: questionResponses.length
      };
    });

    // 6. Update analytics document
    const analytics = await Analytics.findOneAndUpdate(
      { examId },
      {
        totalStudentsAttempted: uniqueStudents.length,
        passPercentage,
        scoreDistribution: Object.entries(distribution).map(([range, count]) => ({
          range,
          count
        })),
        questionStats,
        participation,
        lastUpdated: new Date()
      },
      { upsert: true, new: true, runValidators: true }
    );

    // 7. Populate question text for readability
    await Analytics.populate(analytics, {
      path: 'questionStats.questionId',
      select: 'questionText'
    });

    return analytics;

  } catch (error) {
    console.error('Analytics update failed:', error);
    throw error;
  }
};
// Controller to get analytics
export const getExamAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Force fresh analytics
    const analytics = await updateExamAnalytics(examId);
    
    if (!analytics) {
      return res.status(404).json({ 
        success: false, 
        message: "Analytics not found for this exam" 
      });
    }

    // Populate question texts
    await Analytics.populate(analytics, {
      path: 'questionStats.questionId',
      select: 'questionText'
    });

    res.status(200).json({ 
      success: true, 
      analytics 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
// Helper: Hourly Participation
const calculateHourlyParticipation = (logs) => {
  const hourlyMap = new Map();
  
  logs.forEach(log => {
    log.events.forEach(event => {
      if (event.type === 'start') {
        const hour = new Date(event.timestamp);
        hour.setMinutes(0, 0, 0);
        const key = hour.toISOString();
        
        hourlyMap.set(key, (hourlyMap.get(key) || 0) + 1);
      }
    });
  });

  return Array.from(hourlyMap).map(([hour, count]) => ({
    hour: new Date(hour),
    count
  }));
};

// Helper: Daily Participation
const calculateDailyParticipation = (logs) => {
  const dailyMap = new Map();

  logs.forEach(log => {
    const day = new Date(log.createdAt);
    day.setHours(0, 0, 0, 0);
    const key = day.toISOString();
    
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  });

  return Array.from(dailyMap).map(([date, count]) => ({
    date: new Date(date),
    count
  }));
};
// Helper: Generate score distribution
const calculateScoreDistribution = (scores, totalMarksDoc) => {
  const distribution = {
    '0-25%': 0,
    '25-50%': 0,
    '50-75%': 0,
    '75-100%': 0
  };

  // Handle null/undefined cases
  if (!scores || scores.length === 0) return [];
  if (!totalMarksDoc?.totalMarks || totalMarksDoc.totalMarks <= 0) {
    return Object.entries(distribution).map(([range]) => ({
      range,
      count: 0
    }));
  }

  const totalMarks = totalMarksDoc.totalMarks;
  
  scores.forEach(score => {
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    if (percentage <= 25) distribution['0-25%']++;
    else if (percentage <= 50) distribution['25-50%']++;
    else if (percentage <= 75) distribution['50-75%']++;
    else distribution['75-100%']++;
  });

  return Object.entries(distribution).map(([range, count]) => ({
    range,
    count
  }));
};

