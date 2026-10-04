import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── College / Department ────────────────────────────────
  const dept = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { name: 'Computer Science & Engineering', code: 'CSE', college: 'SRM University' },
  });

  // ─── Subjects ────────────────────────────────────────────
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { code: 'CS201' },
      update: {},
      create: { code: 'CS201', name: 'Data Structures & Algorithms', departmentId: dept.id, semester: 2 },
    }),
    prisma.subject.upsert({
      where: { code: 'MA201' },
      update: {},
      create: { code: 'MA201', name: 'Linear Algebra & Calculus', departmentId: dept.id, semester: 2 },
    }),
    prisma.subject.upsert({
      where: { code: 'EC101' },
      update: {},
      create: { code: 'EC101', name: 'Digital Logic Design', departmentId: dept.id, semester: 1 },
    }),
  ]);

  // ─── Units ───────────────────────────────────────────────
  const units = await Promise.all([
    prisma.unit.create({ data: { name: 'Arrays & Linked Lists', subjectId: subjects[0].id, order: 1 } }),
    prisma.unit.create({ data: { name: 'Stacks & Queues', subjectId: subjects[0].id, order: 2 } }),
    prisma.unit.create({ data: { name: 'Trees & Graphs', subjectId: subjects[0].id, order: 3 } }),
    prisma.unit.create({ data: { name: 'Sorting & Searching', subjectId: subjects[0].id, order: 4 } }),
    prisma.unit.create({ data: { name: 'Hashing & Dynamic Programming', subjectId: subjects[0].id, order: 5 } }),
    prisma.unit.create({ data: { name: 'Matrices & Determinants', subjectId: subjects[1].id, order: 1 } }),
    prisma.unit.create({ data: { name: 'Eigenvalues & Eigenvectors', subjectId: subjects[1].id, order: 2 } }),
    prisma.unit.create({ data: { name: 'Differential Equations', subjectId: subjects[1].id, order: 3 } }),
    prisma.unit.create({ data: { name: 'Boolean Algebra', subjectId: subjects[2].id, order: 1 } }),
    prisma.unit.create({ data: { name: 'Combinational Circuits', subjectId: subjects[2].id, order: 2 } }),
    prisma.unit.create({ data: { name: 'Sequential Circuits', subjectId: subjects[2].id, order: 3 } }),
  ]);

  // ─── Course Outcomes ─────────────────────────────────────
  const cos = await Promise.all([
    prisma.courseOutcome.create({ data: { code: 'CO1', description: 'Understand fundamental concepts', subjectId: subjects[0].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO2', description: 'Apply algorithms to problems', subjectId: subjects[0].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO3', description: 'Analyze algorithmic complexity', subjectId: subjects[0].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO1', description: 'Understand matrix operations', subjectId: subjects[1].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO2', description: 'Solve differential equations', subjectId: subjects[1].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO1', description: 'Understand Boolean logic', subjectId: subjects[2].id } }),
    prisma.courseOutcome.create({ data: { code: 'CO2', description: 'Design combinational circuits', subjectId: subjects[2].id } }),
  ]);

  // ─── Sample Questions (150+) ─────────────────────────────
  const questionTypes = ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'NUMERICAL', 'FILL_IN_BLANKS', 'CASE_STUDY'];
  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  const bloomLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

  let count = 0;
  for (const subj of subjects) {
    const subjUnits = units.filter(u => u.subjectId === subj.id);
    const subjCos = cos.filter(c => c.subjectId === subj.id);
    for (let i = 0; i < 50; i++) {
      const unit = subjUnits[i % subjUnits.length];
      const co = subjCos[i % subjCos.length];
      const type = questionTypes[i % questionTypes.length];
      const difficulty = difficulties[i % difficulties.length];
      const bloom = bloomLevels[i % bloomLevels.length];
      const marks = difficulty === 'EASY' ? 2 : difficulty === 'MEDIUM' ? 5 : 10;

      const question = await prisma.question.create({
        data: {
          subjectId: subj.id,
          unitId: unit.id,
          courseOutcomeId: co.id,
          type,
          text: `Sample ${type} question ${i + 1} for ${unit.name} (${difficulty}, ${bloom})`,
          options: type === 'MCQ' ? [
            { label: 'A', text: 'Option A', isCorrect: true },
            { label: 'B', text: 'Option B', isCorrect: false },
            { label: 'C', text: 'Option C', isCorrect: false },
            { label: 'D', text: 'Option D', isCorrect: false },
          ] : undefined,
          modelAnswer: type === 'MCQ' ? 'A' : type === 'TRUE_FALSE' ? 'TRUE' : 'Detailed answer required',
          marks,
          difficulty,
          bloomLevel: bloom,
          tags: [unit.name, subj.code],
          usageCount: 0,
          createdBy: '',
        },
      });
      count++;
    }
  }

  console.log(`✅ Seeded ${count} questions across ${subjects.length} subjects`);

  // ─── Sample User ─────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  await prisma.user.upsert({
    where: { email: 'admin@qpforge.com' },
    update: {},
    create: {
      email: 'admin@qpforge.com',
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      college: 'SRM University',
    },
  });

  await prisma.user.upsert({
    where: { email: 'faculty@qpforge.com' },
    update: {},
    create: {
      email: 'faculty@qpforge.com',
      passwordHash: hashedPassword,
      name: 'Faculty User',
      role: 'FACULTY',
      departmentId: dept.id,
      college: 'SRM University',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@qpforge.com' },
    update: {},
    create: {
      email: 'student@qpforge.com',
      passwordHash: hashedPassword,
      name: 'Student User',
      role: 'STUDENT',
      departmentId: dept.id,
      college: 'SRM University',
    },
  });

  console.log('✅ Seeded sample users (admin, faculty, student)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });