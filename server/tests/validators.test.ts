import { createQuestionSchema, createBlueprintSchema, loginSchema, registerSchema } from '../src/utils/validators';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates a correct email and password', () => {
      const valid = { email: 'admin@srmrmp.edu.in', password: 'password123' };
      const parsed = loginSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      const invalid = { email: 'not-an-email', password: 'password123' };
      const parsed = loginSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates valid user registration data', () => {
      const valid = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'FACULTY',
        departmentId: 'dept-1',
      };
      const parsed = registerSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });
  });

  describe('createQuestionSchema', () => {
    it('validates valid question creation', () => {
      const valid = {
        text: 'Explain the difference between TCP and UDP protocols with diagrams.',
        type: 'LONG_ANSWER',
        marks: 10,
        difficulty: 'MEDIUM',
        bloomLevel: 'UNDERSTAND',
        subjectId: 'sub-123',
        unitId: 'unit-123',
        modelAnswer: 'TCP is connection-oriented while UDP is connectionless...',
      };
      const parsed = createQuestionSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('rejects questions with negative marks', () => {
      const invalid = {
        text: 'Sample question',
        type: 'SHORT_ANSWER',
        marks: -5,
        difficulty: 'EASY',
        bloomLevel: 'REMEMBER',
        subjectId: 'sub-123',
      };
      const parsed = createQuestionSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('createBlueprintSchema', () => {
    it('validates blueprint request payload', () => {
      const valid = {
        name: 'Semester End Examination Blueprint',
        type: 'SEMESTER_EXAM',
        subjectId: 'sub-123',
        duration: 180,
        totalMarks: 100,
        sections: [
          {
            name: 'Part A',
            order: 1,
            numQuestions: 10,
            marksPerQuestion: 2,
            questionType: 'SHORT_ANSWER',
            difficulty: 'EASY',
            bloomLevel: 'REMEMBER',
          },
          {
            name: 'Part B',
            order: 2,
            numQuestions: 5,
            marksPerQuestion: 16,
            questionType: 'LONG_ANSWER',
            difficulty: 'HARD',
            bloomLevel: 'APPLY',
          },
        ],
      };
      const parsed = createBlueprintSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });
  });
});
