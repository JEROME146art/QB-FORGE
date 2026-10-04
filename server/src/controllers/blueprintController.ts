import { Request, Response } from 'express';
import { prisma } from '../config';

export const createBlueprint = async (req: Request, res: Response): Promise<void> => {
  const { name, type, subjectId, sections, constraints, totalMarks, duration } = req.body;

  const blueprint = await prisma.blueprint.create({
    data: {
      name,
      type,
      subjectId,
      facultyId: req.user?.id ?? '',
      sections: {
        create: sections.map((s: any) => ({
          name: s.name,
          order: s.order,
          numQuestions: s.numQuestions,
          marksPerQuestion: s.marksPerQuestion,
          questionType: s.questionType,
          difficulty: s.difficulty,
          bloomLevel: s.bloomLevel,
          unitId: s.unitId,
          choiceCount: s.choiceCount,
          compulsory: s.compulsory ?? true,
        })),
      },
      constraints,
      totalMarks,
      duration,
    },
    include: { sections: true },
  });

  res.status(201).json({ success: true, data: blueprint });
};

export const getBlueprints = async (req: Request, res: Response): Promise<void> => {
  const { subjectId } = req.query;
  const where: any = {};
  if (subjectId) where.subjectId = subjectId;
  if (req.user?.role === 'FACULTY') where.facultyId = req.user.id;

  const blueprints = await prisma.blueprint.findMany({
    where,
    include: { sections: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: blueprints });
};

export const getBlueprint = async (req: Request, res: Response): Promise<void> => {
  const blueprint = await prisma.blueprint.findUnique({
    where: { id: req.params.blueprintId },
    include: { sections: true, subject: true },
  });
  if (!blueprint) {
    res.status(404).json({ success: false, message: 'Blueprint not found' });
    return;
  }
  res.json({ success: true, data: blueprint });
};

export const deleteBlueprint = async (req: Request, res: Response): Promise<void> => {
  await prisma.blueprint.delete({ where: { id: req.params.blueprintId } });
  res.json({ success: true, message: 'Blueprint deleted' });
};

export const getPresets = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      SEMESTER_EXAM: {
        name: 'Semester Exam',
        totalMarks: 100,
        duration: 180,
        sections: [
          { name: 'Part A', order: 1, numQuestions: 10, marksPerQuestion: 2, questionType: 'SHORT_ANSWER', compulsory: true },
          { name: 'Part B', order: 2, numQuestions: 5, marksPerQuestion: 13, questionType: 'SHORT_ANSWER', compulsory: true },
          { name: 'Part C', order: 3, numQuestions: 1, marksPerQuestion: 15, questionType: 'CASE_STUDY', compulsory: true },
        ],
      },
      CAT: {
        name: 'Continuous Assessment Test',
        totalMarks: 50,
        duration: 90,
        sections: [
          { name: 'Part A', order: 1, numQuestions: 5, marksPerQuestion: 2, questionType: 'MCQ', compulsory: true },
          { name: 'Part B', order: 2, numQuestions: 2, marksPerQuestion: 13, questionType: 'SHORT_ANSWER', compulsory: false, choiceCount: 2 },
          { name: 'Part C', order: 3, numQuestions: 1, marksPerQuestion: 14, questionType: 'CASE_STUDY', compulsory: true },
        ],
      },
    },
  });
};