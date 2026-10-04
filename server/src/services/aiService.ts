import { env } from '../config';
import { logger } from '../utils/logger';
import Anthropic from '@anthropic-ai/sdk';

export interface ClaudeQuestion {
  question: string;
  type: 'MCQ' | 'Short Answer' | 'Long Answer' | 'Fill in the blanks' | 'True/False' | 'Numerical' | 'Case Study';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  marks: number;
  options?: { label: string; text: string; isCorrect: boolean }[];
  modelAnswer?: string;
  tags?: string[];
}

export interface AIGenerationRequest {
  text: string;
  numQuestions: number;
  questionType: 'MCQ' | 'Short Answer' | 'Long Answer' | 'Fill in the blanks' | 'True/False' | 'Numerical' | 'Case Study';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  marks: number;
}

export interface AIGenerationResponse {
  questions: ClaudeQuestion[];
  promptTokens: number;
  completionTokens: number;
}

export async function generateQuestionsFromText(
  req: AIGenerationRequest,
): Promise<ClaudeQuestion[]> {
  if (!env.anthropicApiKey || env.anthropicApiKey.startsWith('sk-ant-xxx') || env.anthropicApiKey === 'your-api-key') {
    logger.info('Anthropic API key not provided or placeholder, using intelligent local question generator');
    return generateLocalFallbackQuestions(req);
  }

  try {
    const client = new Anthropic({
      apiKey: env.anthropicApiKey,
    });

    const prompt = createPrompt(req);

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.7,
      system: `You are an expert exam question setter for college-level engineering courses. You generate ${req.questionType} questions based on academic text. Always output STRICT JSON only (no prose, no markdown fences).`,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/m) || content.match(/(\[[\s\S]*\])/m);

    const rawJson = jsonMatch ? jsonMatch[1] : content.trim();
    const parsed: ClaudeQuestion[] = JSON.parse(rawJson);

    return parsed;
  } catch (err: any) {
    logger.error('Claude API call failed, using intelligent local generator:', err.message);
    return generateLocalFallbackQuestions(req);
  }
}

function generateLocalFallbackQuestions(req: AIGenerationRequest): ClaudeQuestion[] {
  const sentences = req.text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const questions: ClaudeQuestion[] = [];
  const count = Math.max(1, req.numQuestions || 3);

  for (let i = 0; i < count; i++) {
    const sentence = sentences[i % (sentences.length || 1)] || `Core concepts in modern computing and system design.`;
    const words = sentence.split(/\s+/).filter(w => w.length > 4);
    const keyTerm = words[0] || 'algorithm';

    if (req.questionType === 'MCQ') {
      questions.push({
        question: `Which of the following statements best describes the key characteristics of ${keyTerm.replace(/[^a-zA-Z]/g, '')} as discussed in the text?`,
        type: 'MCQ',
        difficulty: req.difficulty,
        bloomLevel: req.bloomLevel,
        marks: req.marks || 2,
        options: [
          { label: 'A', text: sentence, isCorrect: true },
          { label: 'B', text: `It operates independently without requiring runtime verification or constraints.`, isCorrect: false },
          { label: 'C', text: `It serves solely as an inverted lookup index with static boundaries.`, isCorrect: false },
          { label: 'D', text: `None of the mentioned alternatives.`, isCorrect: false },
        ],
        modelAnswer: `Option A: ${sentence}`,
        tags: [keyTerm.toLowerCase(), 'concept', req.difficulty.toLowerCase()],
      });
    } else if (req.questionType === 'Short Answer') {
      questions.push({
        question: `Explain the fundamental role and key properties of ${keyTerm} in the context of: "${sentence.slice(0, 80)}..."`,
        type: 'Short Answer',
        difficulty: req.difficulty,
        bloomLevel: req.bloomLevel,
        marks: req.marks || 5,
        modelAnswer: `Key points: 1) Definition and significance of ${keyTerm}. 2) Contextual application: ${sentence}. 3) Performance and boundary trade-offs.`,
        tags: [keyTerm.toLowerCase(), 'short-answer', req.bloomLevel.toLowerCase()],
      });
    } else {
      questions.push({
        question: `Analyze in detail the architecture, working principles, and evaluation criteria associated with: "${sentence}". Provide illustrative examples and discuss time/space complexities.`,
        type: req.questionType,
        difficulty: req.difficulty,
        bloomLevel: req.bloomLevel,
        marks: req.marks || 10,
        modelAnswer: `Detailed breakdown should include: Architecture description, algorithmic formulation, step-by-step trace based on ${sentence}, and comparative advantages.`,
        tags: [keyTerm.toLowerCase(), 'analysis', req.difficulty.toLowerCase()],
      });
    }
  }

  return questions;
}

function createPrompt(req: AIGenerationRequest): string {
  const typeDescriptions: Record<string, string> = {
    'MCQ': 'Multiple Choice Question with 4 options (A, B, C, D). Provide "options" array with {label, text, isCorrect}.',
    'Short Answer': 'A concise short-answer question (1-2 sentences).',
    'Long Answer': 'A long-answer question requiring detailed explanation.',
    'Fill in the blanks': 'A sentence with one or more blanks to fill.',
    'True/False': 'A statement requiring True or False answer.',
    'Numerical': 'A numerical problem requiring a numeric answer.',
    'Case Study': 'A scenario-based question requiring analysis.',
  };

  return `Generate ${req.numQuestions} ${req.questionType} question(s) from the text below.

INSTRUCTIONS:
- ${typeDescriptions[req.questionType]}
- Difficulty: ${req.difficulty}
- Bloom's level: ${req.bloomLevel}
- Each question should be worth approximately ${req.marks} marks
- Output STRICT JSON array only (no prose, no markdown formatting):
[
  {
    "question": "the question text",
    "type": "${req.questionType}",
    "difficulty": "${req.difficulty}",
    "bloomLevel": "${req.bloomLevel}",
    "marks": ${req.marks},
    "options": [
      { "label": "A", "text": "...", "isCorrect": true },
      { "label": "B", "text": "...", "isCorrect": false },
      { "label": "C", "text": "...", "isCorrect": false },
      { "label": "D", "text": "...", "isCorrect": false }
    ],
    "modelAnswer": "brief model answer / marking points",
    "tags": ["tag1", "tag2"]
  }
]

CONTENT TO GENERATE FROM:
${req.text}
`;
}

export interface MarkingScheme {
  marksPerQuestion: number;
  negativeMarking?: number;
  passMark?: number;
}

export interface QuestionForExport {
  id: number;
  text: string;
  type: string;
  marks: number;
  difficulty: string;
  bloomLevel: string;
  modelAnswer?: string;
}