import { Request, Response } from 'express';
import { prisma } from '../config';

export const getAllSubjects = async (_req: Request, res: Response): Promise<void> => {
  const subjects = await prisma.subject.findMany({
    include: { department: true, program: true, units: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: subjects });
};

export const createSubject = async (req: Request, res: Response): Promise<void> => {
  const { code, name, departmentId, programId, semester, description } = req.body as {
    code: string;
    name: string;
    departmentId?: string;
    programId?: string;
    semester?: number;
    description?: string;
  };

  const existing = await prisma.subject.findUnique({ where: { code } });
  if (existing) {
    res.status(400).json({ success: false, message: 'Subject code already exists' });
    return;
  }

  const subject = await prisma.subject.create({
    data: {
      code,
      name,
      departmentId: departmentId || undefined,
      programId: programId || undefined,
      semester: semester ?? 1,
      description: description || undefined,
    },
    include: { department: true, program: true },
  });

  res.status(201).json({ success: true, data: subject });
};

export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
  const { subjectId } = req.params;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { department: true, program: true, units: true, questions: true, blueprints: true },
  });
  if (!subject) {
    res.status(404).json({ success: false, message: 'Subject not found' });
    return;
  }
  res.json({ success: true, data: subject });
};