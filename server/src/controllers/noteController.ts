import { Request, Response } from 'express';
import { prisma } from '../config';
import { upload } from '../config/upload';
import { extractTextFromUpload } from '../services/textExtraction';
import { generateQuestionsFromText } from '../services/aiService';
import { logger } from '../utils/logger';

export const uploadNote = async (req: Request, res: Response): Promise<void> => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }

    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const { title, subjectId, unitId } = req.body;
    const note = await prisma.note.create({
      data: {
        title,
        subjectId,
        unitId,
        filePath: file.path,
        fileType: file.mimetype,
        uploadedBy: req.user!.id,
      },
    });

    try {
      const extractedText = await extractTextFromUpload(file.path, file.mimetype);
      await prisma.note.update({
        where: { id: note.id },
        data: { extractedText },
      });
    } catch (error) {
      logger.error('Text extraction failed:', error);
    }

    res.status(201).json({ success: true, data: note });
  });
};

export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
  const { noteId, numQuestions, questionType, difficulty, bloomLevel, marks } = req.body;

  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || !note.extractedText) {
    res.status(400).json({ success: false, message: 'Note not found or text not extracted' });
    return;
  }

  try {
    const questions = await generateQuestionsFromText({
      text: note.extractedText,
      numQuestions,
      questionType,
      difficulty,
      bloomLevel,
      marks,
    });
    res.json({ success: true, data: questions });
  } catch (error) {
    logger.error('AI generation failed:', error);
    res.status(500).json({ success: false, message: 'AI generation failed' });
  }
};

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  const { subjectId } = req.query;
  const where: any = {};
  if (subjectId) where.subjectId = subjectId;

  const notes = await prisma.note.findMany({
    where,
    include: { subject: true, unit: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: notes });
};