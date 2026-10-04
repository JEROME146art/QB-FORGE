import { Request, Response } from 'express';
import { prisma } from '../config';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  const [totalQuestions, totalPapers, totalUsers, totalAttempts] = await Promise.all([
    prisma.question.count({ where: { deletedAt: null } }),
    prisma.paper.count(),
    prisma.user.count(),
    prisma.attempt.count(),
  ]);

  res.json({
    success: true,
    data: { totalQuestions, totalPapers, totalUsers, totalAttempts },
  });
};

export const getQuestionDistribution = async (_req: Request, res: Response): Promise<void> => {
  const [byUnit, byDifficulty, byBloom, byType] = await Promise.all([
    prisma.question.groupBy({ by: ['unitId'], _count: true, where: { deletedAt: null } }),
    prisma.question.groupBy({ by: ['difficulty'], _count: true, where: { deletedAt: null } }),
    prisma.question.groupBy({ by: ['bloomLevel'], _count: true, where: { deletedAt: null } }),
    prisma.question.groupBy({ by: ['type'], _count: true, where: { deletedAt: null } }),
  ]);

  res.json({ success: true, data: { byUnit, byDifficulty, byBloom, byType } });
};

export const getPaperTrends = async (_req: Request, res: Response): Promise<void> => {
  const papers = await prisma.paper.groupBy({
    by: ['createdAt'],
    _count: true,
    where: { status: 'FINALIZED' },
  });

  res.json({ success: true, data: papers });
};

export const getStudentPerformance = async (_req: Request, res: Response): Promise<void> => {
  const attempts = await prisma.attempt.findMany({
    where: { status: 'AUTO_GRADED' },
    include: { student: true, paperSet: { include: { paper: true } } },
    take: 50,
  });

  res.json({ success: true, data: attempts });
};