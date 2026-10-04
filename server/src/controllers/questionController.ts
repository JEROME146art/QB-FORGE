import { Request, Response } from 'express';
import { prisma } from '../config';
import { logger } from '../utils/logger';
import { createQuestionSchema, updateQuestionSchema, bulkImportRowSchema, exportQuerySchema, duplicateQuerySchema, usageSchema } from '../utils/validators';
import { incrementQuestionUsage, findQuestionDuplicates, exportQuestionsToBuffer } from '../services/questionService';
import XLSX from 'xlsx';

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  const result = createQuestionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation error', errors: result.error.format });
    return;
  }

  const data = result.data;
  logger.info(`Creating question by user ${req.user?.id}: type=${data.type}, difficulty=${data.difficulty}`);

  const auditLog: any = {
    action: 'CREATE',
    entity: 'Question',
    actorId: req.user!.id,
  };

  const question = await prisma.question.create({
    data: {
      subjectId: data.subjectId,
      unitId: data.unitId || undefined,
      courseOutcomeId: data.courseOutcomeId || undefined,
      type: data.type,
      text: data.text,
      options: data.options || undefined,
      modelAnswer: data.modelAnswer || undefined,
      markingScheme: data.markingScheme,
      marks: data.marks,
      difficulty: data.difficulty,
      bloomLevel: data.bloomLevel,
      tags: data.tags || [],
      createdBy: req.user!.id,
    },
    include: { unit: true, courseOutcome: true, subject: true },
  });

  // Audit log
  try {
    await prisma.auditLog.create({
      data: { ...auditLog, metadata: { questionType: data.type, textLength: data.text.length } },
    });
  } catch (ae) {
    logger.warn('Audit log creation failed:', ae);
  }

  res.status(201).json({ success: true, data: question });
};

export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  const { subjectId, type, difficulty, bloomLevel, unitId, courseOutcomeId, tags, search, page = '1', limit = '20' } = req.query;

  const where: any = {};
  if (subjectId) where.subjectId = subjectId;
  if (type) where.type = type;
  if (difficulty) where.difficulty = difficulty;
  if (bloomLevel) where.bloomLevel = bloomLevel;
  if (unitId) where.unitId = unitId;
  if (courseOutcomeId) where.courseOutcomeId = courseOutcomeId;
  if (tags) {
    const tagList = tags.toString().split(',').map((t: string) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      where.tags = {
        hasSome: tagList,
      };
    }
  }
  if (search) {
    where.OR = [
      { text: { contains: search as string, mode: 'insensitive' } },
      { tags: { has: search as string } },
    ];
  }
  where.deletedAt = null;

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: { unit: true, courseOutcome: true, subject: true },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.question.count({ where }),
  ]);

  res.json({
    success: true,
    data: questions,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const getQuestionById = async (req: Request, res: Response): Promise<void> => {
  const question = await prisma.question.findUnique({
    where: { id: req.params.questionId },
    include: { unit: true, courseOutcome: true, subject: true },
  });
  if (!question) {
    res.status(404).json({ success: false, message: 'Question not found' });
    return;
  }
  res.json({ success: true, data: question });
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  const result = updateQuestionSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation error', errors: result.error.format });
    return;
  }

  const existing = await prisma.question.findUnique({ where: { id: req.params.questionId } });
  if (!existing) {
    res.status(404).json({ success: false, message: 'Question not found' });
    return;
  }
  const data = result.data;
  logger.info(`Updating question ${req.params.questionId} by user ${req.user?.id}`);

  const question = await prisma.question.update({
    where: { id: req.params.questionId },
    data: { ...data, updatedAt: new Date() },
    include: { unit: true, courseOutcome: true, subject: true },
  });

  // Audit log
  try {
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Question',
        entityId: req.params.questionId,
        actorId: req.user!.id,
      },
    });
  } catch (ae) {
    logger.warn('Audit log creation failed:', ae);
  }

  res.json({ success: true, data: question });
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.question.findUnique({ where: { id: req.params.questionId } });
  if (!existing) {
    res.status(404).json({ success: false, message: 'Question not found' });
    return;
  }
  logger.info(`Deleting question ${req.params.questionId} by user ${req.user?.id}`);

  await prisma.question.update({
    where: { id: req.params.questionId },
    data: { deletedAt: new Date() },
  });

  // Audit log
  try {
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Question',
        entityId: req.params.questionId,
        actorId: req.user!.id,
      },
    });
  } catch (ae) {
    logger.warn('Audit log creation failed:', ae);
  }

  res.json({ success: true, message: 'Question deleted' });
};

export const bulkImport = async (req: Request, res: Response): Promise<void> => {
  // Handle file upload via multer
  const uploadSingle = (req as any).file;
  if (!uploadSingle) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const file = uploadSingle;
  let rows: any[] = [];

  try {
    // Parse file based on extension
    const buffer = file.buffer || await require('fs').promises.readFile(file.path);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  } catch (err) {
    logger.error('File parsing error:', err);
    res.status(400).json({ success: false, message: 'Failed to parse file. Ensure it is a valid CSV or Excel file.' });
    return;
  }

  const errors: { row: number; message: string }[] = [];
  const successful: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = bulkImportRowSchema.safeParse(row);
    if (!result.success) {
      errors.push({
        row: i + 1,
        message: `Validation error: ${result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ')}`,
      });
      continue;
    }

    const data = result.data;
    try {
      const subject = await prisma.subject.findUnique({ where: { code: data.subjectCode } });
      if (!subject) {
        errors.push({ row: i + 1, message: `Subject "${data.subjectCode}" not found` });
        continue;
      }
      const unit = await prisma.unit.findFirst({ where: { name: data.unitName, subjectId: subject.id } });

      // Check for duplicate (exact text match within subject)
      const duplicate = await prisma.question.findFirst({
        where: {
          subjectId: subject.id,
          text: data.text,
          deletedAt: null,
        },
      });
      if (duplicate) {
        errors.push({ row: i + 1, message: 'Duplicate question (identical text already exists in this subject)' });
        continue;
      }

      const question = await prisma.question.create({
        data: {
          subjectId: subject.id,
          unitId: unit?.id || undefined,
          type: data.type,
          text: data.text,
          marks: data.marks,
          difficulty: data.difficulty,
          bloomLevel: data.bloomLevel,
          tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()) : [],
          createdBy: req.user!.id,
        },
      });
      successful.push(question);
    } catch (e) {
      logger.error(`Error creating question at row ${i + 1}:`, e);
      errors.push({ row: i + 1, message: e instanceof Error ? e.message : 'Unknown error' });
    }
  }

  res.json({ success: true, data: { successful, errors, count: successful.length } });
};

export const getQuestionStats = async (_req: Request, res: Response): Promise<void> => {
  const [byType, byDifficulty, byBloom, byUnit, total] = await Promise.all([
    prisma.question.groupBy({ by: ['type'], _count: true, where: { deletedAt: null } }),
    prisma.question.groupBy({ by: ['difficulty'], _count: true, where: { deletedAt: null } }),
    prisma.question.groupBy({ by: ['bloomLevel'], _count: true, where: { deletedAt: null } }),
    prisma.question.groupBy({ by: ['unitId'], _count: true, where: { deletedAt: null } }),
    prisma.question.count({ where: { deletedAt: null } }),
  ]);

  res.json({
    success: true,
    data: { byType, byDifficulty, byBloom, byUnit, total },
  });
};

export const bulkExport = async (req: Request, res: Response): Promise<void> => {
  const result = exportQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation error', errors: result.error.format });
    return;
  }

  const filters = result.data;
  const where: any = { deletedAt: null };
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.type) where.type = filters.type;
  if (filters.difficulty) where.difficulty = filters.difficulty;
  if (filters.bloomLevel) where.bloomLevel = filters.bloomLevel;
  if (filters.tags) {
    const tagList = filters.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      where.tags = {
        hasSome: tagList,
      };
    }
  }

  try {
    const questions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        subject: { select: { code: true } },
        unit: { select: { name: true } },
        type: true,
        text: true,
        options: true,
        modelAnswer: true,
        marks: true,
        difficulty: true,
        bloomLevel: true,
        tags: true,
        usageCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const buffer = exportQuestionsToBuffer({
      questions,
      type: filters.format,
    });

    const filename = `questions-export-${new Date().toISOString().slice(0, 10)}.${filters.format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (filters.format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.send(buffer);
    }
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

export const findDuplicates = async (req: Request, res: Response): Promise<void> => {
  const result = duplicateQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation error', errors: result.error.format });
    return;
  }

  const filters = result.data;
  try {
    const duplicates = await findQuestionDuplicates(filters.subjectId, filters.minCount);
    res.json({ success: true, data: duplicates });
  } catch (error) {
    logger.error('Duplicate detection error:', error);
    res.status(500).json({ success: false, message: 'Duplicate detection failed' });
  }
};

export const incrementUsage = async (req: Request, res: Response): Promise<void> => {
  const result = usageSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, message: 'Validation error', errors: result.error.format });
    return;
  }

  const { questionId } = result.data;
  try {
    // Verify question exists
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
      res.status(404).json({ success: false, message: 'Question not found' });
      return;
    }

    await incrementQuestionUsage(questionId, 'manual-track'); // paperId can be passed if needed
    res.json({ success: true, message: 'Usage tracked' });
  } catch (error) {
    logger.error('Usage tracking error:', error);
    res.status(500).json({ success: false, message: 'Usage tracking failed' });
  }
};