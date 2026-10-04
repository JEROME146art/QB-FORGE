import { PrismaClient, QuestionType, Difficulty, BloomLevel, PaperType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync('logs')) fs.mkdirSync('logs', { recursive: true });

  console.log('🌱 Seeding database...');

  // ─── College / Department ────────────────────────────────
  const dept = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      college: 'SRM University',
      description: 'Department of Computer Science and Engineering',
    },
  });

  // ─── Users (Admin, Faculty, Student) ─────────────────────
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@123', salt);
  const facultyHash = await bcrypt.hash('Faculty@123', salt);
  const studentHash = await bcrypt.hash('Student@123', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@srmrmp.edu.in' },
    update: {},
    create: {
      email: 'admin@srmrmp.edu.in',
      name: 'Dr. Ramesh Kumar (Admin)',
      passwordHash: adminHash,
      role: 'ADMIN',
      college: 'SRM University',
      departmentId: dept.id,
    },
  });

  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@srmrmp.edu.in' },
    update: {},
    create: {
      email: 'faculty@srmrmp.edu.in',
      name: 'Prof. Ananya Sharma',
      passwordHash: facultyHash,
      role: 'FACULTY',
      college: 'SRM University',
      departmentId: dept.id,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@srmrmp.edu.in' },
    update: {},
    create: {
      email: 'student@srmrmp.edu.in',
      name: 'Jerome Student',
      passwordHash: studentHash,
      role: 'STUDENT',
      college: 'SRM University',
      departmentId: dept.id,
    },
  });

  console.log('👤 Seeded users:', { admin: admin.email, faculty: faculty.email, student: student.email });

  // ─── Subjects ────────────────────────────────────────────
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { code: 'CS201' },
      update: {},
      create: { code: 'CS201', name: 'Data Structures & Algorithms', departmentId: dept.id, semester: 2, description: 'Core CS Data Structures course' },
    }),
    prisma.subject.upsert({
      where: { code: 'MA201' },
      update: {},
      create: { code: 'MA201', name: 'Linear Algebra & Calculus', departmentId: dept.id, semester: 2, description: 'Engineering Mathematics II' },
    }),
    prisma.subject.upsert({
      where: { code: 'EC101' },
      update: {},
      create: { code: 'EC101', name: 'Digital Logic Design', departmentId: dept.id, semester: 1, description: 'Fundamentals of Digital Electronics' },
    }),
  ]);

  // ─── Units ───────────────────────────────────────────────
  const units = await Promise.all([
    // CS201 units
    prisma.unit.create({ data: { name: 'Unit 1: Arrays & Linked Lists', subjectId: subjects[0].id, order: 1 } }),
    prisma.unit.create({ data: { name: 'Unit 2: Stacks & Queues', subjectId: subjects[0].id, order: 2 } }),
    prisma.unit.create({ data: { name: 'Unit 3: Trees & Graphs', subjectId: subjects[0].id, order: 3 } }),
    prisma.unit.create({ data: { name: 'Unit 4: Sorting & Searching', subjectId: subjects[0].id, order: 4 } }),
    prisma.unit.create({ data: { name: 'Unit 5: Hashing & Dynamic Programming', subjectId: subjects[0].id, order: 5 } }),
    // MA201 units
    prisma.unit.create({ data: { name: 'Unit 1: Matrices & Determinants', subjectId: subjects[1].id, order: 1 } }),
    prisma.unit.create({ data: { name: 'Unit 2: Eigenvalues & Vector Spaces', subjectId: subjects[1].id, order: 2 } }),
    prisma.unit.create({ data: { name: 'Unit 3: Differential Equations', subjectId: subjects[1].id, order: 3 } }),
    // EC101 units
    prisma.unit.create({ data: { name: 'Unit 1: Boolean Algebra & Logic Gates', subjectId: subjects[2].id, order: 1 } }),
    prisma.unit.create({ data: { name: 'Unit 2: Combinational Logic Circuits', subjectId: subjects[2].id, order: 2 } }),
    prisma.unit.create({ data: { name: 'Unit 3: Sequential Circuits & Flip Flops', subjectId: subjects[2].id, order: 3 } }),
  ]);

  // ─── Course Outcomes ─────────────────────────────────────
  const cos = await Promise.all([
    prisma.courseOutcome.create({ data: { code: 'CO1', description: 'Understand fundamental abstract data types', subjectId: subjects[0].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO2', description: 'Apply trees and graph algorithms to solve engineering problems', subjectId: subjects[0].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO3', description: 'Analyze asymptotic space and time complexity', subjectId: subjects[0].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO1', description: 'Understand matrix transformations and rank', subjectId: subjects[1].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO2', description: 'Solve higher order linear differential equations', subjectId: subjects[1].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO1', description: 'Minimize Boolean functions using K-maps', subjectId: subjects[2].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO2', description: 'Design synchronous sequential logic circuits', subjectId: subjects[2].id } }),
  ]);

  // ─── Sample Rich Questions ──────────────────────────────
  const sampleQuestions = generateSampleQuestions(subjects, units, cos, faculty.id);

  for (const q of sampleQuestions) {
    await prisma.question.create({ data: q });
  }

  // ─── Blueprints ──────────────────────────────────────────
  const semesterBlueprint = await prisma.blueprint.create({
    data: {
      name: 'Semester End Examination (100 Marks)',
      type: PaperType.SEMESTER_EXAM,
      subjectId: subjects[0].id,
      facultyId: faculty.id,
      totalMarks: 100,
      duration: 180,
      sections: {
        create: [
          { name: 'Part A - Short Answer', order: 1, numQuestions: 10, marksPerQuestion: 2, questionType: QuestionType.SHORT_ANSWER, compulsory: true },
          { name: 'Part B - Detailed Analysis', order: 2, numQuestions: 5, marksPerQuestion: 13, questionType: QuestionType.LONG_ANSWER, compulsory: true },
          { name: 'Part C - Comprehensive Case Study', order: 3, numQuestions: 1, marksPerQuestion: 15, questionType: QuestionType.CASE_STUDY, compulsory: true },
        ],
      },
    },
  });

  const catBlueprint = await prisma.blueprint.create({
    data: {
      name: 'Continuous Assessment Test 1 (50 Marks)',
      type: PaperType.CAT,
      subjectId: subjects[0].id,
      facultyId: faculty.id,
      totalMarks: 50,
      duration: 90,
      sections: {
        create: [
          { name: 'Part A - MCQs', order: 1, numQuestions: 5, marksPerQuestion: 2, questionType: QuestionType.MCQ, compulsory: true },
          { name: 'Part B - Core Problems', order: 2, numQuestions: 2, marksPerQuestion: 13, questionType: QuestionType.SHORT_ANSWER, compulsory: true },
          { name: 'Part C - Application Problem', order: 3, numQuestions: 1, marksPerQuestion: 14, questionType: QuestionType.LONG_ANSWER, compulsory: true },
        ],
      },
    },
  });

  console.log(`✅ Seeded ${sampleQuestions.length} questions, 2 blueprints (${semesterBlueprint.name}, ${catBlueprint.name})`);
}

function generateSampleQuestions(subjects: any[], units: any[], cos: any[], facultyId: string) {
  const questions: any[] = [];

  const difficulties: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];
  const blooms: BloomLevel[] = [
    BloomLevel.REMEMBER,
    BloomLevel.UNDERSTAND,
    BloomLevel.APPLY,
    BloomLevel.ANALYZE,
    BloomLevel.EVALUATE,
    BloomLevel.CREATE,
  ];

  // CS201 Questions
  const csUnits = units.slice(0, 5);
  const csCOs = cos.slice(0, 3);
  const csSubject = subjects[0];

  const csQuestionTemplates = [
    {
      text: 'Explain the difference between a static array and a dynamic array. Provide the time complexity for inserting an element at the end when reallocation is required: $O(n)$ amortized vs $O(1)$.',
      type: QuestionType.SHORT_ANSWER,
      marks: 2,
      difficulty: Difficulty.EASY,
      bloomLevel: BloomLevel.UNDERSTAND,
      modelAnswer: 'Static arrays have fixed capacity allocated at compile time. Dynamic arrays resize automatically when capacity is reached, offering $O(1)$ amortized insertion.',
    },
    {
      text: 'What is the worst-case time complexity of searching an element in a balanced Binary Search Tree (AVL tree) containing $N$ nodes?\nWhich of the following is correct?',
      type: QuestionType.MCQ,
      marks: 2,
      difficulty: Difficulty.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      options: [
        { label: 'A', text: '$O(\\log N)$', isCorrect: true },
        { label: 'B', text: '$O(N)$', isCorrect: false },
        { label: 'C', text: '$O(N \\log N)$', isCorrect: false },
        { label: 'D', text: '$O(1)$', isCorrect: false },
      ],
      modelAnswer: 'Option A: In an AVL tree, height is guaranteed to be $O(\\log N)$, thus search is $O(\\log N)$.',
    },
    {
      text: 'Write an efficient algorithm in pseudocode to detect a cycle in a Singly Linked List using Floyd\'s Tortoise and Hare approach. Analyze its space complexity.',
      type: QuestionType.SHORT_ANSWER,
      marks: 5,
      difficulty: Difficulty.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      modelAnswer: 'Algorithm: Initialize slow and fast pointers to head. Move slow by 1 step, fast by 2 steps. If slow == fast, cycle exists. Space complexity is $O(1)$.',
    },
    {
      text: 'Design a Min-Heap data structure from scratch. Implement the `insert()` and `extractMin()` operations in detail with tree diagrams and calculate their logarithmic upper bounds.',
      type: QuestionType.LONG_ANSWER,
      marks: 13,
      difficulty: Difficulty.HARD,
      bloomLevel: BloomLevel.CREATE,
      modelAnswer: 'Min-heap satisfies parent <= children. insert() adds at leaf and heapifies up in $O(\\log N)$. extractMin() swaps root with last element and heapifies down in $O(\\log N)$.',
    },
    {
      text: 'A high-throughput e-commerce checkout platform receives 50,000 order requests per second. Evaluate whether a Hash Map with quadratic probing or an AVL Tree is better suited for the session cache. Justify your architectural choice considering collision degradation and worst-case latency.',
      type: QuestionType.CASE_STUDY,
      marks: 15,
      difficulty: Difficulty.HARD,
      bloomLevel: BloomLevel.EVALUATE,
      modelAnswer: 'Hash map with proper load factor (<0.7) provides average $O(1)$ lookup. AVL tree guarantees strict $O(\\log N)$ worst-case without latency spikes from rehashing.',
    },
  ];

  for (let i = 0; i < 40; i++) {
    const template = csQuestionTemplates[i % csQuestionTemplates.length];
    const unit = csUnits[i % csUnits.length];
    const co = csCOs[i % csCOs.length];
    const diff = difficulties[i % difficulties.length];
    const bloom = blooms[i % blooms.length];

    questions.push({
      subjectId: csSubject.id,
      unitId: unit.id,
      courseOutcomeId: co.id,
      type: template.type,
      text: `[${unit.name.split(':')[0]}] ${template.text} (Variation ${i + 1})`,
      options: template.options || undefined,
      modelAnswer: template.modelAnswer,
      marks: template.marks,
      difficulty: diff,
      bloomLevel: bloom,
      tags: ['Data Structures', csSubject.code, unit.name.split(':')[0]],
      usageCount: 0,
      createdBy: facultyId,
    });
  }

  return questions;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });