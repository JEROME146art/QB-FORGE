import { z } from 'zod';
import { QuestionType, Difficulty, BloomLevel, PaperType, Role } from '@prisma/client';

// ─── Auth ────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  name: z.string().min(1).max(100),
  role: z.nativeEnum(Role).optional().default(Role.STUDENT),
  departmentId: z.string().optional(),
  college: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Question ────────────────────────────────────────
export const createQuestionSchema = z.object({
  subjectId: z.string().min(1),
  unitId: z.string().optional().nullable(),
  courseOutcomeId: z.string().optional().nullable(),
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1),
  options: z.array(z.object({ label: z.string(), text: z.string(), isCorrect: z.boolean() })).optional(),
  modelAnswer: z.string().optional().nullable(),
  markingScheme: z.any().optional(),
  marks: z.number().positive(),
  difficulty: z.nativeEnum(Difficulty),
  bloomLevel: z.nativeEnum(BloomLevel),
  tags: z.array(z.string()).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// ─── Bulk Import Row Schema ─────────────────────
export const bulkImportRowSchema = z.object({
  subjectCode: z.string().min(1),
  unitName: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1),
  marks: z.coerce.number().positive(),
  difficulty: z.nativeEnum(Difficulty),
  bloomLevel: z.nativeEnum(BloomLevel),
  tags: z.string().optional(),
});

// ─── Export Query Schema ────────────────────────
export const exportQuerySchema = z.object({
  subjectId: z.string().optional(),
  type: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  bloomLevel: z.nativeEnum(BloomLevel).optional(),
  tags: z.string().optional(),
  format: z.enum(['csv', 'xlsx']).default('csv'),
});

// ─── Duplicate Detection Schema ─────────────────
export const duplicateQuerySchema = z.object({
  subjectId: z.string().optional(),
  minCount: z.coerce.number().int().positive().default(2),
});

// ─── Question Usage Schema ──────────────────────
export const usageSchema = z.object({
  questionId: z.string().min(1),
});

// ─── Blueprint ────────────────────────────────────────
export const createBlueprintSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(PaperType),
  subjectId: z.string().min(1),
  sections: z.array(z.object({
    name: z.string(),
    order: z.number(),
    numQuestions: z.number().int().positive(),
    marksPerQuestion: z.number().positive(),
    questionType: z.nativeEnum(QuestionType).optional().nullable(),
    difficulty: z.nativeEnum(Difficulty).optional().nullable(),
    bloomLevel: z.nativeEnum(BloomLevel).optional().nullable(),
    unitId: z.string().optional().nullable(),
    choiceCount: z.number().int().nonnegative().optional().nullable(),
    compulsory: z.boolean().optional(),
  })),
  constraints: z.any().optional(),
  totalMarks: z.number().positive(),
  duration: z.number().int().positive(),
});