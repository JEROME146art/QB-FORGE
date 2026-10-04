import { Request, Response } from 'express';
import { prisma } from '../config';
import { generatePaper, generateSets } from '../services/paperGenerator';
import { exportPaperToPDF, exportPaperToDOCX } from '../services/exportService';
import { incrementQuestionUsageBatch } from '../services/questionService';
import { logger } from '../utils/logger';

export const createPaper = async (req: Request, res: Response): Promise<void> => {
  const { title, type, subjectId, blueprintId, totalMarks, duration, instructions, collegeHeader } = req.body;

  const paper = await prisma.paper.create({
    data: {
      title,
      type,
      subjectId,
      blueprintId,
      facultyId: req.user!.id,
      totalMarks,
      duration,
      instructions,
      collegeHeader: collegeHeader || undefined,
    },
    include: { subject: true, blueprint: true },
  });

  res.status(201).json({ success: true, data: paper });
};

export const generatePaperFromBlueprint = async (req: Request, res: Response): Promise<void> => {
  const { blueprintId, sets = ['A'] } = req.body;

  const blueprint = await prisma.blueprint.findUnique({
    where: { id: blueprintId },
    include: { sections: true },
  });

  if (!blueprint) {
    res.status(404).json({ success: false, message: 'Blueprint not found' });
    return;
  }

  const result = await generatePaper(blueprint, sets);

  // Track usage for all selected questions
  if (result.success) {
    const allQuestionIds: string[] = [];
    for (const section of result.sections) {
      for (const question of section.questions) {
        allQuestionIds.push(question.id);
      }
    }
    // Use a temporary paperId since the paper might not be created yet
    // The paperId will be updated when the paper is actually created
    if (allQuestionIds.length > 0) {
      await incrementQuestionUsageBatch(allQuestionIds, 'generated-' + blueprintId);
    }
  }

  res.json({ success: true, data: result });
};

export const getPaper = async (req: Request, res: Response): Promise<void> => {
  const paper = await prisma.paper.findUnique({
    where: { id: req.params.paperId },
    include: { subject: true, blueprint: true, sets: { include: { questions: { include: { question: true } } } } },
  });
  if (!paper) {
    res.status(404).json({ success: false, message: 'Paper not found' });
    return;
  }
  res.json({ success: true, data: paper });
};

export const listPapers = async (req: Request, res: Response): Promise<void> => {
  const { subjectId, status, facultyId } = req.query;
  const where: any = {};
  if (subjectId) where.subjectId = subjectId;
  if (status) where.status = status;
  if (facultyId) where.facultyId = facultyId;
  if (req.user?.role === 'FACULTY') where.facultyId = req.user.id;

  const papers = await prisma.paper.findMany({
    where,
    include: { subject: true, sets: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: papers });
};

export const updatePaper = async (req: Request, res: Response): Promise<void> => {
  const paper = await prisma.paper.update({
    where: { id: req.params.paperId },
    data: { ...req.body, updatedAt: new Date() },
    include: { subject: true, sets: true },
  });
  res.json({ success: true, data: paper });
};

export const deletePaper = async (req: Request, res: Response): Promise<void> => {
  await prisma.paper.delete({ where: { id: req.params.paperId } });
  res.json({ success: true, message: 'Paper deleted' });
};

export const exportPaper = async (req: Request, res: Response): Promise<void> => {
  const { format } = req.body as { format: 'PDF' | 'DOCX' };
  const paper = await prisma.paper.findUnique({
    where: { id: req.params.paperId },
    include: { sets: { include: { questions: { include: { question: true } } } } },
  });

  if (!paper) {
    res.status(404).json({ success: false, message: 'Paper not found' });
    return;
  }

  try {
    if (format === 'PDF') {
      const url = await exportPaperToPDF(paper);
      await prisma.paper.update({ where: { id: paper.id }, data: { status: 'EXPORTED' } });
      res.json({ success: true, data: { url } });
    } else if (format === 'DOCX') {
      const url = await exportPaperToDOCX(paper);
      await prisma.paper.update({ where: { id: paper.id }, data: { status: 'EXPORTED' } });
      res.json({ success: true, data: { url } });
    } else {
      res.status(400).json({ success: false, message: 'Invalid format' });
    }
  } catch (error) {
    logger.error('Export failed:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

export const clonePaper = async (req: Request, res: Response): Promise<void> => {
  const original = await prisma.paper.findUnique({
    where: { id: req.params.paperId },
    include: { sets: true, questions: true },
  });
  if (!original) {
    res.status(404).json({ success: false, message: 'Paper not found' });
    return;
  }

  const cloned = await prisma.paper.create({
    data: {
      title: `${original.title} (Clone)`,
      type: original.type,
      subjectId: original.subjectId,
      blueprintId: original.blueprintId,
      facultyId: req.user!.id,
      totalMarks: original.totalMarks,
      duration: original.duration,
      instructions: original.instructions,
      collegeHeader: original.collegeHeader as any,
      version: 1,
    },
  });

  res.json({ success: true, data: cloned });
};

export const swapQuestion = async (req: Request, res: Response): Promise<void> => {
  const { paperQuestionId, newQuestionId } = req.body;

  await prisma.paperQuestion.update({
    where: { id: paperQuestionId },
    data: { questionId: newQuestionId, version: { increment: 1 } },
  });

  res.json({ success: true, message: 'Question swapped' });
};