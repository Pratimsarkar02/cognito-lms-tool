// resultController.js — complete rewrite
import Result from '../models/resultModel.js';
import Exam from '../models/examModel.js';
import ExamAttempt from '../models/examAttemptModel.js';
import { Parser } from 'json2csv';

// ─── AUTH HELPER ─────────────────────────────────────────────────────────────
const canManageExam = (exam, user) => {
  if (user.role === 'Admin') return true;
  if (!exam.createdBy) return false;
  if (user.role === 'Faculty' && exam.createdBy.toString() === user.id.toString()) return true;
  return false;
};

// ─── GENERATE RESULTS ────────────────────────────────────────────────────────
// POST /api/results/:examId/generate
// Computes Result docs from ExamAttempt data using upsert.
// Sets exam.resultsStatus → 'generated'. Students still cannot see results.

export const generateResults = async (req, res) => {
  try {
    const { examId } = req.params;
    console.log(`[generateResults] examId=${examId} user=${req.user?.id} role=${req.user?.role}`);

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to generate results for this exam' });
    }

    if (exam.resultsStatus === 'published') {
      return res.status(400).json({ success: false, message: 'Results are already published. Unpublish first to re-generate.' });
    }

    const completedAttempts = await ExamAttempt.find({ examId, isCompleted: true }).lean();
    console.log(`[generateResults] Found ${completedAttempts.length} completed attempts`);

    if (completedAttempts.length === 0) {
      return res.status(400).json({ success: false, message: 'No completed exam attempts found for this exam.' });
    }

    // Get unique student IDs
    const studentIds = [...new Set(completedAttempts.map(a => a.studentId.toString()))];
    console.log(`[generateResults] Unique students: ${studentIds.length}`);

    const generated = await Promise.all(
      studentIds.map(async (studentIdStr) => {
        try {
          const attempts = await ExamAttempt.find({
            examId,
            studentId: studentIdStr,
            isCompleted: true,
          }).lean();

          if (!attempts.length) return null;

          // Find best attempt by marks obtained
          let bestAttempt = attempts[0];
          for (const attempt of attempts) {
            if ((attempt.marksObtained || 0) > (bestAttempt.marksObtained || 0)) {
              bestAttempt = attempt;
            }
          }

          const totalMarks = exam.totalMarks || 0;
          const marksObtained = bestAttempt.marksObtained || 0;
          const percentage = totalMarks > 0 ? (marksObtained / totalMarks) * 100 : 0;
          const isPassed = percentage >= (exam.passingPercentage || 40);

          const allAttemptsData = attempts.map(a => ({
            attemptId: a._id,
            marksObtained: a.marksObtained || 0,
            totalMarks,
            percentage: totalMarks > 0 ? ((a.marksObtained || 0) / totalMarks) * 100 : 0,
            timestamp: a.createdAt,
          }));

          // Upsert: create or update the result document
          return await Result.findOneAndUpdate(
            { examId, studentId: studentIdStr },
            {
              examId,
              studentId: studentIdStr,
              marksObtained,
              totalMarks,
              percentage,
              isPassed,
              bestAttemptId: bestAttempt._id,
              allAttempts: allAttemptsData,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (err) {
          console.error(`[generateResults] Error for student ${studentIdStr}:`, err.message);
          return null;
        }
      })
    );

    const validResults = generated.filter(Boolean);
    await Exam.findByIdAndUpdate(examId, { resultsStatus: 'generated' });

    console.log(`[generateResults] Generated ${validResults.length} results, status → generated`);
    res.status(200).json({
      success: true,
      message: `Results generated for ${validResults.length} student(s). Review and publish when ready.`,
      count: validResults.length,
    });
  } catch (error) {
    console.error('[generateResults] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUBLISH RESULTS ─────────────────────────────────────────────────────────
// PATCH /api/results/:examId/publish

export const publishResults = async (req, res) => {
  try {
    const { examId } = req.params;
    console.log(`[publishResults] examId=${examId} user=${req.user?.id}`);

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to publish results for this exam' });
    }
    if (exam.resultsStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Generate results first before publishing.' });
    }
    if (exam.resultsStatus === 'published') {
      return res.status(400).json({ success: false, message: 'Results are already published.' });
    }

    await Exam.findByIdAndUpdate(examId, { resultsStatus: 'published' });
    res.status(200).json({ success: true, message: 'Results published. Students can now view their scores.' });
  } catch (error) {
    console.error('[publishResults] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UNPUBLISH RESULTS ───────────────────────────────────────────────────────
// PATCH /api/results/:examId/unpublish

export const unpublishResults = async (req, res) => {
  try {
    const { examId } = req.params;
    console.log(`[unpublishResults] examId=${examId} user=${req.user?.id}`);

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to unpublish results for this exam' });
    }
    if (exam.resultsStatus !== 'published') {
      return res.status(400).json({ success: false, message: 'Results are not currently published.' });
    }

    await Exam.findByIdAndUpdate(examId, { resultsStatus: 'generated' });
    res.status(200).json({ success: true, message: 'Results unpublished. Students can no longer see their scores.' });
  } catch (error) {
    console.error('[unpublishResults] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET RESULTS FOR ONE EXAM ────────────────────────────────────────────────
// GET /api/results/:examId
// Faculty/Admin: visible if status is 'generated' OR 'published'
// Student: only if status is 'published'

export const getResults = async (req, res) => {
  try {
    const { examId } = req.params;
    console.log(`[getResults] examId=${examId} user=${req.user?.id} role=${req.user?.role}`);

    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const isStudent = req.user.role === 'Student';
    const isManager = canManageExam(exam, req.user);

    if (isStudent && exam.resultsStatus !== 'published') {
      return res.status(200).json({
        success: true,
        resultsStatus: exam.resultsStatus,
        results: [],
        message: exam.resultsStatus === 'pending'
          ? 'Results have not been generated yet.'
          : 'Results are under review. Your instructor has not published them yet.',
      });
    }

    if (!isStudent && !isManager) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these results' });
    }

    if (exam.resultsStatus === 'pending') {
      return res.status(200).json({
        success: true,
        resultsStatus: 'pending',
        results: [],
        message: 'No results generated yet for this exam.',
      });
    }

    const query = isStudent ? { examId, studentId: req.user.id } : { examId };

    const results = await Result.find(query)
      .populate({ path: 'studentId', select: 'firstName lastName email', model: 'user-details' })
      .populate({ path: 'bestAttemptId', select: 'startTime endTime', model: 'ExamAttempt' })
      .lean();

    const validated = results.map(r => ({
      ...r,
      percentage: Number((r.percentage || 0).toFixed(2)),
      isPassed: (r.percentage || 0) >= (exam.passingPercentage || 40),
    }));

    console.log(`[getResults] Returning ${validated.length} results, status=${exam.resultsStatus}`);
    res.status(200).json({ success: true, resultsStatus: exam.resultsStatus, results: validated });
  } catch (error) {
    console.error('[getResults] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET ALL RESULTS (role-filtered) ────────────────────────────────────────
// GET /api/results/all

export const getAllStudentResults = async (req, res) => {
  try {
    const { role, id } = req.user;
    console.log(`[getAllStudentResults] role=${role} id=${id}`);

    if (role === 'Student') {
      const publishedExamIds = await Exam.find({ resultsStatus: 'published' }).distinct('_id');
      const results = await Result.find({ studentId: id, examId: { $in: publishedExamIds } })
        .populate({ path: 'examId', select: 'title totalMarks passingPercentage resultsStatus startTime endTime' })
        .populate({ path: 'bestAttemptId', select: 'startTime endTime', model: 'ExamAttempt' })
        .sort({ createdAt: -1 })
        .lean();

      console.log(`[getAllStudentResults] Student: ${results.length} results`);
      return res.status(200).json({
        success: true,
        results: results.map(r => ({
          ...r,
          percentage: Number((r.percentage || 0).toFixed(2)),
          isPassed: (r.percentage || 0) >= (r.examId?.passingPercentage || 40),
        })),
      });
    }

    if (role === 'Faculty') {
      const myExamIds = await Exam.find({
        createdBy: id,
        resultsStatus: { $in: ['generated', 'published'] },
      }).distinct('_id');

      console.log(`[getAllStudentResults] Faculty: ${myExamIds.length} exams with results`);

      if (myExamIds.length === 0) {
        return res.status(200).json({ success: true, results: [] });
      }

      const results = await Result.find({ examId: { $in: myExamIds } })
        .populate({
          path: 'examId',
          select: 'title totalMarks passingPercentage resultsStatus createdBy startTime endTime',
        })
        .populate({ path: 'studentId', select: 'firstName lastName email', model: 'user-details' })
        .populate({ path: 'bestAttemptId', select: 'startTime endTime', model: 'ExamAttempt' })
        .sort({ createdAt: -1 })
        .lean();

      console.log(`[getAllStudentResults] Faculty: ${results.length} results`);
      return res.status(200).json({
        success: true,
        results: results.map(r => ({
          ...r,
          percentage: Number((r.percentage || 0).toFixed(2)),
          isPassed: (r.percentage || 0) >= (r.examId?.passingPercentage || 40),
        })),
      });
    }

    if (role === 'Admin') {
      const allResults = await Result.find({})
        .populate({
          path: 'examId',
          select: 'title totalMarks passingPercentage resultsStatus createdBy startTime endTime',
          populate: { path: 'createdBy', select: 'firstName lastName role' },
        })
        .populate({ path: 'studentId', select: 'firstName lastName email', model: 'user-details' })
        .populate({ path: 'bestAttemptId', select: 'startTime endTime', model: 'ExamAttempt' })
        .sort({ createdAt: -1 })
        .lean();

      const filtered = allResults.filter(r => r.examId?.resultsStatus !== 'pending');
      console.log(`[getAllStudentResults] Admin: ${filtered.length} results`);
      return res.status(200).json({
        success: true,
        results: filtered.map(r => ({
          ...r,
          percentage: Number((r.percentage || 0).toFixed(2)),
          isPassed: (r.percentage || 0) >= (r.examId?.passingPercentage || 40),
        })),
      });
    }

    return res.status(403).json({ success: false, message: 'Unknown role' });
  } catch (error) {
    console.error('[getAllStudentResults] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── EXPORT CSV ──────────────────────────────────────────────────────────────
// GET /api/results/:examId/export

export const exportExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (!canManageExam(exam, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (exam.resultsStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Results have not been generated yet.' });
    }

    const results = await Result.find({ examId })
      .populate('studentId', 'firstName lastName email')
      .populate('examId', 'title totalMarks')
      .lean();

    if (!results.length) {
      return res.status(404).json({ success: false, message: 'No results to export.' });
    }

    const csvFields = [
      { label: 'Student Name', value: row => `${row.studentId?.firstName || ''} ${row.studentId?.lastName || ''}` },
      { label: 'Email', value: 'studentId.email' },
      { label: 'Exam Title', value: 'examId.title' },
      { label: 'Total Marks', value: 'totalMarks' },
      { label: 'Marks Obtained', value: 'marksObtained' },
      { label: 'Percentage', value: row => `${(row.percentage || 0).toFixed(2)}%` },
      { label: 'Result', value: row => (row.isPassed ? 'Pass' : 'Fail') },
    ];

    const csv = new Parser({ fields: csvFields }).parse(results);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=results-${examId}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('[exportExamResults] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};