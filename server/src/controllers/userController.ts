import { Request, Response } from 'express';
import { prisma } from '../config';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { department: true },
  });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  const { passwordHash, refreshToken, ...safeUser } = user as any;
  res.json({ success: true, data: safeUser });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { name, college, phone, avatarUrl, departmentId } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, college, phone, avatarUrl, departmentId },
    include: { department: true },
  });
  const { passwordHash, refreshToken, ...safeUser } = user as any;
  res.json({ success: true, data: safeUser });
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const { role, page = '1', limit = '20' } = req.query;
  const where: any = {};
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { department: true },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  const safeUsers = users.map((u: any) => {
    const { passwordHash, refreshToken, ...rest } = u;
    return rest;
  });

  res.json({
    success: true,
    data: safeUsers,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  await prisma.user.delete({ where: { id: req.params.userId } });
  res.json({ success: true, message: 'User deleted' });
};

export const getAuditLogs = async (_req: Request, res: Response): Promise<void> => {
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    take: 100,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: logs });
};