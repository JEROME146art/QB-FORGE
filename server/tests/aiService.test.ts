import { generateQuestionsFromText } from '../src/services/aiService';

describe('AIService - Question Generation & Fallback', () => {
  it('generates questions using local heuristic generator when no API key is set', async () => {
    const result = await generateQuestionsFromText({
      text: 'A Binary Search Tree (BST) is a node-based binary tree data structure where each node has at most two children. The left subtree of a node contains only nodes with keys lesser than the nodes key. The right subtree contains only nodes with keys greater than the nodes key. Operations include insertion, deletion, and search with average time complexity of O(log N).',
      numQuestions: 4,
      difficulty: 'Medium',
      bloomLevel: 'Apply',
      questionType: 'MCQ',
      marks: 2,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const first = result[0];
    expect(first).toHaveProperty('question');
    expect(first).toHaveProperty('type');
    expect(first).toHaveProperty('marks');
    expect(first).toHaveProperty('difficulty');
    expect(first).toHaveProperty('bloomLevel');
  });

  it('generates Short Answer questions correctly with model answers', async () => {
    const result = await generateQuestionsFromText({
      text: 'Relational Database Management Systems use SQL for data query and manipulation. ACID properties guarantee that database transactions are processed reliably: Atomicity, Consistency, Isolation, and Durability.',
      numQuestions: 2,
      difficulty: 'Hard',
      bloomLevel: 'Analyze',
      questionType: 'Short Answer',
      marks: 5,
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].type).toBe('Short Answer');
    expect(result[0].marks).toBe(5);
    expect(result[0].modelAnswer).toBeDefined();
  });
});
