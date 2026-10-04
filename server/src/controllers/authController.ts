import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { prisma } from '../config';
import { config } from '../config';
import { RegisterInput, LoginInput } from '../types/auth.types';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role } = req.body as RegisterInput;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400).json({ success: false, message: 'User already exists' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: { email, passwordHash: hashedPassword, name, role },
    select: { id: true, email: true, name: true, role: true },
  });

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpiresIn as any },
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn as any },
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user, accessToken: token, refreshToken },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwtAccessSecret,
    { expiresIn: config.jwtAccessExpiresIn as any },
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn as any },
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken: token, refreshToken },
  });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token required' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      config.jwtAccessSecret,
      { expiresIn: config.jwtAccessExpiresIn as any },
    );

    res.json({ success: true, data: { accessToken: token } });
  } catch (_) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};