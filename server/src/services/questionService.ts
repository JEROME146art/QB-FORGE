import { prisma } from '../config';
import { logger } from '../utils/logger';
import XLSX from 'xlsx';

/**
 * Track question usage whenever it is selected into a generated paper.
 * Increments usageCount and records which paper it was last used in.
 */
export async function incrementQuestionUsage(questionId: string, paperId: string): Promise<void> {
  try {
    await prisma.question.update({
      where: { id: questionId },
      data: {
        usageCount: { increment: 1 },
        lastUsedInPaperId: paperId,
      },
    });
  } catch (error) {
    logger.error(`Failed to increment usage for question ${questionId}:`, error);
  }
}

/**
 * Track usage for multiple questions in one transaction.
 */
export async function incrementQuestionUsageBatch(
  questionIds: string[],
  paperId: string,
): Promise<void> {
  if (questionIds.length === 0) return;
  try {
    await prisma.$transaction(
      questionIds.map((id) =>
        prisma.question.update({
          where: { id },
          data: {
            usageCount: { increment: 1 },
            lastUsedInPaperId: paperId,
          },
        }),
      ),
    );
  } catch (error) {
    logger.error(`Failed to batch increment usage for paper ${paperId}:`, error);
  }
}

/**
 * Find duplicate questions in the bank.
 * - Exact duplicate: identical normalized text (whitespace-insensitive)
 * - Near duplicate: similar text detected via simple Jaccard similarity on words
 */
export interface DuplicateInfo {
  questions: any[];
  type: 'exact' | 'near';
  similarity?: number;
}

export async function findQuestionDuplicates(
  subjectId?: string,
  minCount = 2,
): Promise<DuplicateInfo[]> {
  const where: any = { deletedAt: null };
  if (subjectId) where.subjectId = subjectId;

  const questions = await prisma.question.findMany({
    where,
    select: { id: true, text: true, tags: true, type: true, marks: true, difficulty: true, bloomLevel: true },
  });

  // Normalize text for comparison
  const normalized = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim();

  const exactGroups = new Map<string, string[]>(); // normalizedText -> [ids]
  const nearGroups: { id: string; similarTo: string; similarity: number }[] = [];

  for (const q of questions) {
    const key = normalized(q.text);
    if (exactGroups.has(key)) {
      exactGroups.get(key)!.push(q.id);
    } else {
      exactGroups.set(key, [q.id]);
    }
  }

  // Report exact duplicates
  const result: DuplicateInfo[] = [];
  for (const [, ids] of exactGroups) {
    if (ids.length >= minCount) {
      const groupQuestions = questions.filter((q: { id: string }) => ids.includes(q.id));
      result.push({ questions: groupQuestions, type: 'exact' });
    }
  }

  // Near-duplicate detection: compare texts sharing a subject and type
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const a = questions[i];
      const b = questions[j];
      if (normalized(a.text) === normalized(b.text)) continue; // already exact

      // Only compare same type questions in same subject for relevance
      if (a.type !== b.type) continue;

      const sim = jaccardSimilarity(a.text, b.text);
      if (sim > 0.6) {
        nearGroups.push({ id: a.id, similarTo: b.id, similarity: sim });
      }
    }
  }

  // Group near duplicates by primary ID
  const nearMap = new Map<string, any[]>();
  for (const { id, similarTo } of nearGroups) {
    if (!nearMap.has(id)) {
      nearMap.set(id, [
        questions.find((q: { id: string }) => q.id === id)!,
        questions.find((q: { id: string }) => q.id === similarTo)!,
      ]);
    } else {
      nearMap.get(id)!.push(questions.find((q: { id: string }) => q.id === similarTo)!);
    }
  }
  for (const [, groupedQuestions] of nearMap.entries()) {
    if (groupedQuestions.length >= minCount) {
      result.push({ questions: groupedQuestions, type: 'near', similarity: 0.65 });
    }
  }

  return result;
}

function jaccardSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().trim().split(/\s+/).filter((t) => t.length > 2));
  const tokensB = new Set(b.toLowerCase().trim().split(/\s+/).filter((t) => t.length > 2));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection += 1;
  }
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Export questions to CSV or XLSX buffer.
 */
export function exportQuestionsToBuffer(filters: {
  questions: any[];
  type: 'csv' | 'xlsx';
}): Buffer {
  const rows = filters.questions.map((q) => ({
    id: q.id,
    subjectCode: q.subject?.code || q.subjectId,
    unitName: q.unit?.name || 'Unassigned',
    type: q.type,
    text: cleanExportText(q.text),
    options: serializeOptions(q.options),
    modelAnswer: q.modelAnswer || '',
    marks: q.marks,
    difficulty: q.difficulty,
    bloomLevel: q.bloomLevel,
    tags: (q.tags || []).join('; '),
    usageCount: q.usageCount,
    createdAt: q.createdAt?.toISOString(),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');

  if (filters.type === 'xlsx') {
    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  }
  return XLSX.write(wb, { bookType: 'csv', type: 'buffer' });
}

function cleanExportText(text: string): string {
  // For CSV compatibility, escape quotes and avoid newlines
  return (text || '')
    .replace(/"/g, '""')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

function serializeOptions(options: any): string {
  if (!Array.isArray(options)) return '';
  return options.map((o: any) => `[${o.label}] ${o.text}`).join(' | ');
}
