import { Request, Response } from 'express';
import { prisma } from '../config';

export const startAttempt = async (req: Request, res: Response): Promise<void> => {
  const { paperSetId } = req.body;

  const paperSet = await prisma.paperSet.findUnique({
    where: { id: paperSetId },
    include: { questions: true },
  });

  const maxScore = paperSet?.questions.reduce((sum, q) => sum + q.marks, 0) || 100;

  const attempt = await prisma.attempt.create({
    data: {
      paperSetId,
      studentId: req.user!.id,
      status: 'IN_PROGRESS',
      maxScore,
    },
    include: { paperSet: { include: { questions: { include: { question: true } } } } },
  });
  res.status(201).json({ success: true, data: attempt });
};

export const submitAttempt = async (req: Request, res: Response): Promise<void> => {
  const { attemptId, answers } = req.body as { attemptId: string; answers: { questionId: string; answer: string }[] };

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { paperSet: { include: { questions: { include: { question: true } } } } },
  });

  if (!attempt) {
    res.status(404).json({ success: false, message: 'Attempt not found' });
    return;
  }

  let score = 0;
  const answerRecords: any[] = [];

  for (const ans of answers) {
    const paperQuestion = attempt.paperSet.questions.find(q => q.questionId === ans.questionId);
    if (!paperQuestion) continue;

    const question = paperQuestion.question;
    let isCorrect = false;
    let marksEarned = 0;

    if (question.type === 'MCQ') {
      const options = question.options as any[];
      const correctOption = options?.find(o => o.isCorrect);
      isCorrect = correctOption?.label === ans.answer;
      marksEarned = isCorrect ? paperQuestion.marks : 0;
    } else if (question.type === 'TRUE_FALSE') {
      isCorrect = (ans.answer === 'TRUE' && question.modelAnswer === 'TRUE') ||
                  (ans.answer === 'FALSE' && question.modelAnswer === 'FALSE');
      marksEarned = isCorrect ? paperQuestion.marks : 0;
    }

    score += marksEarned;
    answerRecords.push({
      attemptId,
      questionId: ans.questionId,
      answer: ans.answer,
      isCorrect,
      marksEarned,
    });
  }

  await prisma.attemptAnswer.createMany({ data: answerRecords });
  const updatedAttempt = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: 'AUTO_GRADED',
      score,
      maxScore: attempt.paperSet.questions.reduce((sum, q) => sum + q.marks, 0),
      submittedAt: new Date(),
    },
    include: { answers: { include: { question: true } } },
  });

  res.json({ success: true, data: updatedAttempt });
};

export const getAttemptHistory = async (req: Request, res: Response): Promise<void> => {
  const attempts = await prisma.attempt.findMany({
    where: { studentId: req.user!.id },
    include: { paperSet: { include: { paper: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: attempts });
};

export const getAttemptResult = async (req: Request, res: Response): Promise<void> => {
  const attempt = await prisma.attempt.findUnique({
    where: { id: req.params.attemptId },
    include: {
      paperSet: { include: { paper: true, questions: { include: { question: true } } } },
      answers: { include: { question: true } },
    },
  });
  if (!attempt) {
    res.status(404).json({ success: false, message: 'Attempt not found' });
    return;
  }
  res.json({ success: true, data: attempt });
};