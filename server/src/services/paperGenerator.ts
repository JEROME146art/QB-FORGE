import { prisma } from '../config/prisma';
import { Question, QuestionType, Difficulty, BloomLevel, Prisma } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Paper Blueprint Generator
// ─────────────────────────────────────────────────────────────────────────────

type PoolItem = {
  question: Question;
  weight: number;
};

function distributionToCounts(
  counts: Record<string, number>,
  total: number,
): Record<string, number> {
  const floored: Record<string, number> = {};
  const remainders: { label: string; frac: number }[] = [];
  let remainingTotal = total;

  for (const [key, pct] of Object.entries(counts)) {
    const flooredVal = Math.floor((pct / 100) * total);
    floored[key] = flooredVal;
    remainders.push({ label: key, frac: (pct / 100) * total - flooredVal });
    remainingTotal -= flooredVal;
  }

  const sorted = remainders.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainingTotal; i++) {
    floored[sorted[i].label] += 1;
  }

  // Guard against zero for a required category
  for (const key of Object.keys(counts)) {
    if (floored[key] === 0 && pctOfTotal(floored, total) === 0) {
      const minReq = Math.floor((counts[key] / 100) * total);
      floored[key] = Math.max(floored[key], minReq >= total ? 1 : Math.max(1, minReq));
    }
  }

  return floored;
}

function pctOfTotal(floored: Record<string, number>, total: number): number {
  return (Object.values(floored).reduce((a, b) => a + b, 0) / (total || 1)) * 100;
}

// Weighted random choice: weight = 1 / (difficultyRank + bloomRank)
function weightedDraw(items: PoolItem[]): PoolItem | null {
  const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);
  if (totalWeight <= 0) return null;
  let rnd = Math.random() * totalWeight;
  for (const item of items) {
    rnd -= item.weight;
    if (rnd <= 0) return item;
  }
  return items[items.length - 1];
}

async function poolBy(
  section: any,
  subjectId: string,
  unitId: string | null,
  usedQuestionIds: string[],
): Promise<PoolItem[]> {
  const filters: Prisma.QuestionWhereInput = {
    subjectId,
    deletedAt: null,
    id: { notIn: usedQuestionIds },
  };

  if (section.questionType) filters.type = section.questionType as QuestionType;
  if (section.difficulty) filters.difficulty = section.difficulty as Difficulty;
  if (section.bloomLevel) filters.bloomLevel = section.bloomLevel as BloomLevel;
  if (unitId) filters.unitId = unitId;

  const questions = await prisma.question.findMany({
    where: filters,
  });

  return questions.map((q) => ({
    question: q,
    weight:
      1 / (
        (q.difficulty === Difficulty.EASY ? 1 : q.difficulty === Difficulty.MEDIUM ? 2 : 3) +
        (q.bloomLevel === BloomLevel.REMEMBER ? 1 :
         q.bloomLevel === BloomLevel.UNDERSTAND ? 2 :
         q.bloomLevel === BloomLevel.APPLY ? 3 :
         q.bloomLevel === BloomLevel.ANALYZE ? 4 :
         q.bloomLevel === BloomLevel.EVALUATE ? 5 : 6)
      ),
  }));
}

async function fillSection(
  section: any,
  subjectId: string,
  usedQuestionIds: string[],
  attempts: number,
): Promise<{ questions: Question[]; unitMap: Record<string, number>; status: 'done' | 'retry' | 'fail'; reason?: string }> {
  const { numQuestions, unitId } = section;

  const pool = await poolBy(section, subjectId, unitId, usedQuestionIds);
  if (pool.length === 0) {
    return {
      questions: [],
      unitMap: {},
      status: 'fail',
      reason: `No available questions in the pool (type=${section.questionType || 'ANY'}, difficulty=${section.difficulty || 'ANY'}, unit=${unitId || 'ANY'})`,
    };
  }

  // Default distributions when user did not specify
  const difficultyPct = {
    [Difficulty.EASY]: section.difficulty ? 100 : 30,
    [Difficulty.MEDIUM]: section.difficulty ? 0 : 50,
    [Difficulty.HARD]: section.difficulty ? 0 : 20,
  };
  const bloomPct = {
    [BloomLevel.REMEMBER]: section.bloomLevel ? 100 : 25,
    [BloomLevel.UNDERSTAND]: section.bloomLevel ? 0 : 30,
    [BloomLevel.APPLY]: section.bloomLevel ? 0 : 20,
    [BloomLevel.ANALYZE]: section.bloomLevel ? 0 : 10,
    [BloomLevel.EVALUATE]: section.bloomLevel ? 0 : 10,
    [BloomLevel.CREATE]: section.bloomLevel ? 0 : 5,
  };

  // If a single unit / difficulty / Bloom is locked, take that exactly
  if ((section.difficulty && section.bloomLevel) || unitId) {
    const selected = pool.slice(0, numQuestions).map(p => p.question);
    if (selected.length < numQuestions) {
      return { questions: selected, unitMap: {}, status: 'fail', reason: `Not enough questions of the locked constraint (need ${numQuestions}, available ${selected.length})` };
    }
    const unitMap: Record<string, number> = {};
    selected.forEach((q) => {
      unitMap[q.unitId || 'UNSPECIFIED'] = (unitMap[q.unitId || 'UNSPECIFIED'] || 0) + 1;
    });
    return { questions: selected, unitMap, status: 'done' };
  }

  const diffCounts = distributionToCounts(difficultyPct, numQuestions);
  const bloomCounts = distributionToCounts(bloomPct, numQuestions);

  const selected: Question[] = [];
  const unitMap: Record<string, number> = {};
  let retryCount = 0;

  while (selected.length < numQuestions && retryCount < attempts) {
    const remaining = pool.filter((it) => !selected.some((q) => q.id === it.question.id));
    if (remaining.length === 0) {
      break;
    }

    // Find a candidate that helps the largest deficit
    const sorted = remaining
      .filter((it) => (diffCounts[it.question.difficulty] || 0) > 0 && (bloomCounts[it.question.bloomLevel] || 0) > 0)
      .sort((a, b) => b.weight - a.weight);

    let picked: PoolItem | null = null;
    if (sorted.length > 0) {
      picked = sorted[0];
    } else {
      picked = weightedDraw(remaining);
    }
    if (!picked) break;

    if ((diffCounts[picked.question.difficulty] || 0) > 0) {
      diffCounts[picked.question.difficulty] -= 1;
    }
    if ((bloomCounts[picked.question.bloomLevel] || 0) > 0) {
      bloomCounts[picked.question.bloomLevel] -= 1;
    }

    selected.push(picked.question);
    unitMap[picked.question.unitId || 'UNSPECIFIED'] = (unitMap[picked.question.unitId || 'UNSPECIFIED'] || 0) + 1;
    usedQuestionIds.push(picked.question.id);
    retryCount += 1;
  }

  if (selected.length < numQuestions) {
    const shortfall = numQuestions - selected.length;
    const fallback = pool
      .filter((it) => !selected.some((q) => q.id === it.question.id))
      .slice(0, shortfall);
    if (fallback.length > 0) {
      fallback.forEach((it) => {
        selected.push(it.question);
        unitMap[it.question.unitId || 'UNSPECIFIED'] = (unitMap[it.question.unitId || 'UNSPECIFIED'] || 0) + 1;
        usedQuestionIds.push(it.question.id);
      });
      return { questions: selected, unitMap, status: 'retry' };
    }
    return { questions: selected, unitMap, status: 'fail', reason: `Could not fill section "${section.name}": need ${numQuestions}, got ${selected.length}` };
  }

  return { questions: selected, unitMap, status: 'done' };
}

export interface PaperGenerationResult {
  success: boolean;
  sections: {
    name: string;
    questions: any[];
    totalMarks: number;
    unitMap: Record<string, number>;
  }[];
  sets: Record<string, { name: string; sections: any[] }>;
  errors: string[];
}

type SectionResult = {
  questions: Question[];
  unitMap: Record<string, number>;
  status: 'done' | 'retry' | 'fail';
  reason?: string;
};

export async function generatePaper(
  blueprint: any,
  _sets: string[] = ['A'],
): Promise<PaperGenerationResult> {
  const errors: string[] = [];
  const sectionResults = new Map<string, SectionResult>();

  for (const section of blueprint.sections) {
    const result = await fillSection(
      section,
      blueprint.subjectId,
      [],
      50,
    );
    sectionResults.set(section.name, result);
    if (result.status === 'fail') {
      errors.push(`${section.name}: ${result.reason || 'Could not fill section'}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, sections: [], sets: {}, errors };
  }

  const unitCoverage: Record<string, number> = {};
  const difficultyMap: Record<string, number> = {};
  const bloomMap: Record<string, number> = {};
  let totalMarks = 0;

  for (const [name, res] of sectionResults.entries()) {
    const sectionConfig = blueprint.sections.find((s: any) => s.name === name);
    const marksPerQ = sectionConfig?.marksPerQuestion || 1;
    const sectionMarks = res.questions.length * marksPerQ;
    totalMarks += sectionMarks;
    for (const [unit, count] of Object.entries(res.unitMap)) {
      unitCoverage[unit] = (unitCoverage[unit] || 0) + count;
    }
    for (const q of res.questions) {
      difficultyMap[q.difficulty] = (difficultyMap[q.difficulty] || 0) + 1;
      bloomMap[q.bloomLevel] = (bloomMap[q.bloomLevel] || 0) + 1;
    }
  }

  return {
    success: true,
    sections: Array.from(sectionResults.entries()).map(([name, res]) => {
      const sectionConfig = blueprint.sections.find((s: any) => s.name === name);
      const marksPerQ = sectionConfig?.marksPerQuestion || 1;
      return {
        name,
        questions: res.questions.map((q) => ({
          ...q,
          marks: marksPerQ,
          _totalMarks: res.questions.length * marksPerQ,
        })),
        totalMarks: res.questions.length * marksPerQ,
        unitMap: res.unitMap,
      };
    }),
    sets: {},
    errors: [],
  };
}

export async function generateSets(blueprintId: string, setLabels: string[] = ['A', 'B', 'C']): Promise<PaperGenerationResult> {
  const blueprint = await prisma.blueprint.findUnique({
    where: { id: blueprintId },
    include: { sections: true },
  });

  if (!blueprint) {
    return { success: false, sections: [], sets: {}, errors: ['Blueprint not found'] };
  }

  const sets: Record<string, { name: string; sections: any[] }> = {};
  const errors: string[] = [];

  for (const label of setLabels) {
    const setSections: any[] = [];
    const usedQuestionIds: string[] = [];

    for (const section of blueprint.sections) {
      const res = await fillSection(
        section,
        blueprint.subjectId,
        usedQuestionIds,
        50,
      );
      if (res.status === 'fail') {
        errors.push(`${label} - ${section.name}: ${res.reason || 'Could not fill section'}`);
      } else {
        setSections.push({
          ...section,
          questions: res.questions.map((q) => ({
            ...q,
            marks: section.marksPerQuestion,
            _unitMap: res.unitMap,
          })),
        });
      }
    }

    sets[label] = {
      name: `Set ${label}`,
      sections: setSections,
    };
  }

  return { success: true, sections: [], sets, errors };
}
