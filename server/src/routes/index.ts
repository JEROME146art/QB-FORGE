import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../config/upload';

import { register, login, refreshToken } from '../controllers/authController';
import { getProfile, updateProfile, getAllUsers, deleteUser, getAuditLogs } from '../controllers/userController';
import { getAllSubjects, createSubject, getSubjectById } from '../controllers/subjectController';
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  bulkImport,
  getQuestionStats,
  bulkExport,
  findDuplicates,
  incrementUsage,
} from '../controllers/questionController';
import {
  createPaper,
  generatePaperFromBlueprint,
  getPaper,
  listPapers,
  updatePaper,
  deletePaper,
  exportPaper,
  clonePaper,
  swapQuestion,
} from '../controllers/paperController';
import {
  createBlueprint,
  getBlueprints,
  getBlueprint,
  deleteBlueprint,
  getPresets,
} from '../controllers/blueprintController';
import { uploadNote, generateQuestions, getNotes } from '../controllers/noteController';
import {
  getDashboardStats,
  getQuestionDistribution,
  getPaperTrends,
  getStudentPerformance,
} from '../controllers/analyticsController';
import {
  startAttempt,
  submitAttempt,
  getAttemptHistory,
  getAttemptResult,
} from '../controllers/practiceController';

const router = Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/refresh', refreshToken);

// ─── Users / Profile ─────────────────────────────────────────────────────────
router.get('/users/profile', authenticate, getProfile);
router.patch('/users/profile', authenticate, updateProfile);
router.get('/users', authenticate, authorize('ADMIN'), getAllUsers);
router.delete('/users/:userId', authenticate, authorize('ADMIN'), deleteUser);
router.get('/users/audit-logs', authenticate, authorize('ADMIN'), getAuditLogs);

// ─── Subjects ────────────────────────────────────────────────────────────────
router.get('/subjects', authenticate, getAllSubjects);
router.post('/subjects', authenticate, authorize('ADMIN', 'FACULTY'), createSubject);
router.get('/subjects/:subjectId', authenticate, getSubjectById);

// ─── Questions ───────────────────────────────────────────────────────────────
router.post('/questions', authenticate, authorize('FACULTY', 'ADMIN'), createQuestion);
router.get('/questions', authenticate, getQuestions);
router.get('/questions/stats', authenticate, getQuestionStats);
// Bulk import: file upload (multipart/form-data)
router.post('/questions/bulk-import', authenticate, authorize('FACULTY', 'ADMIN'), upload.single('file'), bulkImport);
// Bulk export: CSV or XLSX
router.get('/questions/export', authenticate, authorize('FACULTY', 'ADMIN'), bulkExport);
// Duplicate detection
router.get('/questions/duplicates', authenticate, authorize('FACULTY', 'ADMIN'), findDuplicates);
// Usage tracking (internal endpoint for paper generation flow)
router.post('/questions/:questionId/usage', authenticate, authorize('FACULTY', 'ADMIN', 'STUDENT'), incrementUsage);
router.get('/questions/:questionId', authenticate, getQuestionById);
router.patch('/questions/:questionId', authenticate, authorize('FACULTY', 'ADMIN'), updateQuestion);
router.delete('/questions/:questionId', authenticate, authorize('FACULTY', 'ADMIN'), deleteQuestion);

// ─── Papers ──────────────────────────────────────────────────────────────────
router.post('/papers', authenticate, authorize('FACULTY', 'ADMIN'), createPaper);
router.post('/papers/generate', authenticate, authorize('FACULTY', 'ADMIN'), generatePaperFromBlueprint);
router.get('/papers', authenticate, listPapers);
router.get('/papers/:paperId', authenticate, getPaper);
router.patch('/papers/:paperId', authenticate, authorize('FACULTY', 'ADMIN'), updatePaper);
router.delete('/papers/:paperId', authenticate, authorize('FACULTY', 'ADMIN'), deletePaper);
router.post('/papers/:paperId/export', authenticate, exportPaper);
router.post('/papers/:paperId/clone', authenticate, clonePaper);
router.post('/papers/swap-question', authenticate, authorize('FACULTY', 'ADMIN'), swapQuestion);

// ─── Blueprints ─────────────────────────────────────────────────────────────
router.post('/blueprints', authenticate, authorize('FACULTY', 'ADMIN'), createBlueprint);
router.get('/blueprints', authenticate, getBlueprints);
router.get('/blueprints/presets', authenticate, getPresets);
router.get('/blueprints/:blueprintId', authenticate, getBlueprint);
router.delete('/blueprints/:blueprintId', authenticate, authorize('FACULTY', 'ADMIN'), deleteBlueprint);

// ─── Notes / AI ─────────────────────────────────────────────────────────────
router.post('/notes/upload', authenticate, authorize('FACULTY', 'ADMIN'), uploadNote);
router.post('/notes/generate-questions', authenticate, authorize('FACULTY', 'ADMIN'), generateQuestions);
router.get('/notes', authenticate, getNotes);

// ─── Analytics ──────────────────────────────────────────────────────────────
router.get('/analytics/dashboard', authenticate, getDashboardStats);
router.get('/analytics/question-distribution', authenticate, getQuestionDistribution);
router.get('/analytics/paper-trends', authenticate, getPaperTrends);
router.get('/analytics/student-performance', authenticate, getStudentPerformance);

// ─── Student Practice ───────────────────────────────────────────────────────
router.post('/attempts/start', authenticate, authorize('STUDENT'), startAttempt);
router.post('/attempts/submit', authenticate, authorize('STUDENT'), submitAttempt);
router.get('/attempts/history', authenticate, authorize('STUDENT'), getAttemptHistory);
router.get('/attempts/:attemptId', authenticate, authorize('STUDENT'), getAttemptResult);

export default router;