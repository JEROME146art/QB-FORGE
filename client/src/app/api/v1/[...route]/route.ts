import { NextRequest, NextResponse } from 'next/server';

// ─── In-Memory Academic Database for Serverless Execution ───────────────
const DEPARTMENTS = [
  { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE', college: 'SRM University' },
  { id: 'dept-2', name: 'Electronics & Communication', code: 'ECE', college: 'SRM University' },
  { id: 'dept-3', name: 'Mathematics & Computing', code: 'MATH', college: 'SRM University' },
];

const SUBJECTS = [
  {
    id: 'sub-1',
    code: 'CS201',
    name: 'Data Structures & Algorithms',
    semester: 2,
    departmentId: 'dept-1',
    department: { name: 'Computer Science & Engineering' },
    units: [
      { id: 'u-1', name: 'Unit 1: Arrays & Linked Lists', order: 1 },
      { id: 'u-2', name: 'Unit 2: Stacks & Queues', order: 2 },
      { id: 'u-3', name: 'Unit 3: Trees & Graphs', order: 3 },
      { id: 'u-4', name: 'Unit 4: Sorting & Searching', order: 4 },
      { id: 'u-5', name: 'Unit 5: Hashing & Dynamic Programming', order: 5 },
    ],
    courseOutcomes: [
      { id: 'co-1', code: 'CO1', description: 'Understand fundamental abstract data types' },
      { id: 'co-2', code: 'CO2', description: 'Apply trees and graph algorithms to engineering problems' },
      { id: 'co-3', code: 'CO3', description: 'Analyze asymptotic space and time complexity' },
    ],
  },
  {
    id: 'sub-2',
    code: 'MA201',
    name: 'Linear Algebra & Calculus',
    semester: 2,
    departmentId: 'dept-3',
    department: { name: 'Mathematics & Computing' },
    units: [
      { id: 'u-6', name: 'Unit 1: Matrices & Determinants', order: 1 },
      { id: 'u-7', name: 'Unit 2: Eigenvalues & Vector Spaces', order: 2 },
      { id: 'u-8', name: 'Unit 3: Differential Equations', order: 3 },
    ],
    courseOutcomes: [
      { id: 'co-4', code: 'CO1', description: 'Understand matrix transformations and rank' },
      { id: 'co-5', code: 'CO2', description: 'Solve higher order linear differential equations' },
    ],
  },
  {
    id: 'sub-3',
    code: 'EC101',
    name: 'Digital Logic Design',
    semester: 1,
    departmentId: 'dept-2',
    department: { name: 'Electronics & Communication' },
    units: [
      { id: 'u-9', name: 'Unit 1: Boolean Algebra & Logic Gates', order: 1 },
      { id: 'u-10', name: 'Unit 2: Combinational Logic Circuits', order: 2 },
      { id: 'u-11', name: 'Unit 3: Sequential Circuits & Flip Flops', order: 3 },
    ],
    courseOutcomes: [
      { id: 'co-6', code: 'CO1', description: 'Minimize Boolean functions using K-maps' },
      { id: 'co-7', code: 'CO2', description: 'Design synchronous sequential logic circuits' },
    ],
  },
];

let USERS = [
  {
    id: 'usr-1',
    email: 'admin@srmrmp.edu.in',
    name: 'Dr. Ramesh Kumar (Admin)',
    role: 'ADMIN',
    department: 'CSE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    email: 'faculty@srmrmp.edu.in',
    name: 'Prof. Ananya Sharma',
    role: 'FACULTY',
    department: 'CSE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-3',
    email: 'student@srmrmp.edu.in',
    name: 'Jerome Student',
    role: 'STUDENT',
    department: 'CSE',
    createdAt: new Date().toISOString(),
  },
];

let QUESTIONS = [
  {
    id: 'q-1',
    subjectId: 'sub-1',
    unitId: 'u-1',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    unit: { name: 'Unit 1: Arrays & Linked Lists' },
    text: 'What is the worst-case time complexity of inserting an element at the beginning of a singly linked list with $N$ nodes?',
    type: 'MCQ',
    marks: 2,
    difficulty: 'EASY',
    bloomLevel: 'REMEMBER',
    options: [
      { label: 'A', text: '$O(1)$', isCorrect: true },
      { label: 'B', text: '$O(N)$', isCorrect: false },
      { label: 'C', text: '$O(\\log N)$', isCorrect: false },
      { label: 'D', text: '$O(N^2)$', isCorrect: false },
    ],
    modelAnswer: 'Inserting at head only requires pointer update: temp->next = head; head = temp, taking O(1) constant time.',
    usageCount: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-2',
    subjectId: 'sub-1',
    unitId: 'u-3',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    unit: { name: 'Unit 3: Trees & Graphs' },
    text: 'Explain the balancing mechanism of AVL Trees with all four rotation cases ($LL, RR, LR, RL$). Provide mathematical height analysis.',
    type: 'LONG_ANSWER',
    marks: 13,
    difficulty: 'HARD',
    bloomLevel: 'ANALYZE',
    modelAnswer: 'An AVL tree maintains height balance factor $BF = |h_L - h_R| \\le 1$. LL rotation is single right rotate; RR is single left rotate; LR is left then right; RL is right then left.',
    usageCount: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-3',
    subjectId: 'sub-1',
    unitId: 'u-4',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    unit: { name: 'Unit 4: Sorting & Searching' },
    text: 'Which sorting algorithm has guaranteed worst-case time complexity of $O(N \\log N)$ and is stable?',
    type: 'MCQ',
    marks: 2,
    difficulty: 'MEDIUM',
    bloomLevel: 'UNDERSTAND',
    options: [
      { label: 'A', text: 'Quick Sort', isCorrect: false },
      { label: 'B', text: 'Merge Sort', isCorrect: true },
      { label: 'C', text: 'Heap Sort', isCorrect: false },
      { label: 'D', text: 'Selection Sort', isCorrect: false },
    ],
    modelAnswer: 'Merge sort divides array into two halves, recursively sorts, and merges in O(N log N) worst-case time with stability.',
    usageCount: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-4',
    subjectId: 'sub-1',
    unitId: 'u-2',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    unit: { name: 'Unit 2: Stacks & Queues' },
    text: 'Evaluate the postfix expression: $6\\;2\\;3\\;+\\;*\\;3\\;8\\;4\\;/\\;-\\;&+$ step-by-step using a stack.',
    type: 'SHORT_ANSWER',
    marks: 5,
    difficulty: 'MEDIUM',
    bloomLevel: 'APPLY',
    modelAnswer: 'Stack states: push 6, 2, 3 -> (2+3)=5 -> 6*5=30 -> push 3, 8, 4 -> (8/4)=2 -> 3-2=1 -> 30+1 = 31.',
    usageCount: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-5',
    subjectId: 'sub-1',
    unitId: 'u-5',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    unit: { name: 'Unit 5: Hashing & Dynamic Programming' },
    text: 'Design a Dynamic Programming solution for the 0/1 Knapsack Problem given weights $W = [2, 3, 4, 5]$ and values $V = [3, 4, 5, 6]$ with capacity $C = 5$.',
    type: 'LONG_ANSWER',
    marks: 14,
    difficulty: 'HARD',
    bloomLevel: 'CREATE',
    modelAnswer: 'Recurrence: $dp[i][w] = \\max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])$. Optimal value is 7 using items 1 and 2.',
    usageCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-6',
    subjectId: 'sub-1',
    unitId: 'u-3',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    unit: { name: 'Unit 3: Trees & Graphs' },
    text: 'Apply Dijkstra\'s algorithm to find the single-source shortest path from source node $A$ in a directed weighted graph.',
    type: 'LONG_ANSWER',
    marks: 13,
    difficulty: 'MEDIUM',
    bloomLevel: 'APPLY',
    modelAnswer: 'Maintains priority queue of unvisited nodes with tentative distance $d(u) + w(u,v) < d(v)$. Complexity $O((V+E)\\log V)$.',
    usageCount: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-7',
    subjectId: 'sub-1',
    unitId: 'u-1',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    unit: { name: 'Unit 1: Arrays & Linked Lists' },
    text: 'Differentiate between singly linked list and doubly linked list with respect to memory overhead and deletion complexity.',
    type: 'SHORT_ANSWER',
    marks: 2,
    difficulty: 'EASY',
    bloomLevel: 'REMEMBER',
    modelAnswer: 'DLL requires two pointers per node (prev, next) with O(1) deletion given pointer to node; SLL requires single pointer with O(N) predecessor traversal.',
    usageCount: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-8',
    subjectId: 'sub-1',
    unitId: 'u-4',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    unit: { name: 'Unit 4: Sorting & Searching' },
    text: 'Case Study: An autonomous drone navigates a 3D grid with dynamic obstacles. Design an optimal spatial data structure (e.g. Octree / KD-Tree) for real-time collision detection.',
    type: 'CASE_STUDY',
    marks: 15,
    difficulty: 'HARD',
    bloomLevel: 'EVALUATE',
    modelAnswer: 'Use a 3D KD-tree with bounding volume hierarchies (BVH) for O(log N) point location and nearest neighbor queries.',
    usageCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-9',
    subjectId: 'sub-2',
    unitId: 'u-6',
    subject: { code: 'MA201', name: 'Linear Algebra & Calculus' },
    unit: { name: 'Unit 1: Matrices & Determinants' },
    text: 'Find the eigenvalues and eigenvectors of the matrix $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$.',
    type: 'SHORT_ANSWER',
    marks: 5,
    difficulty: 'MEDIUM',
    bloomLevel: 'APPLY',
    modelAnswer: 'Characteristic equation: $\\det(A - \\lambda I) = (4-\\lambda)(3-\\lambda) - 2 = \\lambda^2 - 7\\lambda + 10 = 0$. Eigenvalues are $\\lambda_1 = 5, \\lambda_2 = 2$.',
    usageCount: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-10',
    subjectId: 'sub-3',
    unitId: 'u-9',
    subject: { code: 'EC101', name: 'Digital Logic Design' },
    unit: { name: 'Unit 1: Boolean Algebra & Logic Gates' },
    text: 'State and prove De Morgan\'s Theorems algebraically and verify with truth tables.',
    type: 'SHORT_ANSWER',
    marks: 5,
    difficulty: 'EASY',
    bloomLevel: 'REMEMBER',
    modelAnswer: '1) $\\overline{A + B} = \\overline{A} \\cdot \\overline{B}$; 2) $\\overline{A \\cdot B} = \\overline{A} + \\overline{B}$.',
    usageCount: 3,
    createdAt: new Date().toISOString(),
  },
];

let BLUEPRINTS = [
  {
    id: 'bp-1',
    name: 'Semester End Examination (100 Marks)',
    type: 'SEMESTER_EXAM',
    subjectId: 'sub-1',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    totalMarks: 100,
    duration: 180,
    sections: [
      { name: 'Part A - Objective / Short Answers', order: 1, numQuestions: 5, marksPerQuestion: 2, questionType: 'MCQ', compulsory: true },
      { name: 'Part B - Analytical Core Problems', order: 2, numQuestions: 4, marksPerQuestion: 13, questionType: 'LONG_ANSWER', compulsory: true },
      { name: 'Part C - Comprehensive Case Study', order: 3, numQuestions: 1, marksPerQuestion: 15, questionType: 'CASE_STUDY', compulsory: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bp-2',
    name: 'Continuous Assessment Test 1 (50 Marks)',
    type: 'CAT',
    subjectId: 'sub-1',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    totalMarks: 50,
    duration: 90,
    sections: [
      { name: 'Part A - Objective MCQs', order: 1, numQuestions: 5, marksPerQuestion: 2, questionType: 'MCQ', compulsory: true },
      { name: 'Part B - Core Conceptual Problems', order: 2, numQuestions: 2, marksPerQuestion: 13, questionType: 'SHORT_ANSWER', compulsory: true },
      { name: 'Part C - Practical Application', order: 3, numQuestions: 1, marksPerQuestion: 14, questionType: 'LONG_ANSWER', compulsory: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bp-3',
    name: 'Linear Algebra Mid-Term Examination (50 Marks)',
    type: 'CAT',
    subjectId: 'sub-2',
    subject: { code: 'MA201', name: 'Linear Algebra & Calculus' },
    totalMarks: 50,
    duration: 90,
    sections: [
      { name: 'Part A - Definitions & Properties', order: 1, numQuestions: 5, marksPerQuestion: 2, questionType: 'SHORT_ANSWER', compulsory: true },
      { name: 'Part B - Matrix Calculations', order: 2, numQuestions: 4, marksPerQuestion: 10, questionType: 'LONG_ANSWER', compulsory: true },
    ],
    createdAt: new Date().toISOString(),
  },
];

let PAPERS = [
  {
    id: 'paper-1',
    title: 'CS201 Data Structures End Semester Examination 2026',
    type: 'SEMESTER_EXAM',
    subject: { code: 'CS201', name: 'Data Structures & Algorithms' },
    blueprint: { name: 'Semester End Examination (100 Marks)' },
    totalMarks: 100,
    duration: 180,
    status: 'FINALIZED',
    setsCount: 3,
    sections: [
      {
        name: 'Part A - Objective / Short Answers',
        totalMarks: 10,
        questions: QUESTIONS.filter(q => q.marks <= 5),
      },
      {
        name: 'Part B - Analytical Core Problems',
        totalMarks: 52,
        questions: QUESTIONS.filter(q => q.marks > 5),
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

let ATTEMPTS = [
  {
    id: 'att-1',
    title: 'Data Structures Quick Practice #1',
    subjectCode: 'CS201',
    subjectName: 'Data Structures & Algorithms',
    score: 18,
    maxScore: 20,
    percentage: 90,
    completedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'COMPLETED',
  },
  {
    id: 'att-2',
    title: 'Linear Algebra Matrices Drill',
    subjectCode: 'MA201',
    subjectName: 'Linear Algebra & Calculus',
    score: 16,
    maxScore: 20,
    percentage: 80,
    completedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'COMPLETED',
  },
];

// ─── Main Route Dispatcher ────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: { route: string[] } }) {
  const path = params.route.join('/');

  if (path === 'analytics/dashboard') {
    return NextResponse.json({
      success: true,
      data: {
        totalQuestions: QUESTIONS.length,
        totalPapers: PAPERS.length,
        totalUsers: USERS.length,
        totalAttempts: ATTEMPTS.length,
      },
    });
  }

  if (path === 'subjects') {
    return NextResponse.json({ success: true, data: SUBJECTS });
  }

  if (path === 'departments') {
    return NextResponse.json({ success: true, data: DEPARTMENTS });
  }

  if (path === 'questions') {
    const url = new URL(req.url);
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const type = url.searchParams.get('type') || 'ALL';
    const difficulty = url.searchParams.get('difficulty') || 'ALL';
    const bloomLevel = url.searchParams.get('bloomLevel') || 'ALL';

    let filtered = QUESTIONS;
    if (search) {
      filtered = filtered.filter(q => q.text.toLowerCase().includes(search));
    }
    if (type !== 'ALL') {
      filtered = filtered.filter(q => q.type === type);
    }
    if (difficulty !== 'ALL') {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }
    if (bloomLevel !== 'ALL') {
      filtered = filtered.filter(q => q.bloomLevel === bloomLevel);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      pagination: {
        total: filtered.length,
        page: 1,
        limit: 50,
      },
    });
  }

  if (path === 'blueprints') {
    return NextResponse.json({ success: true, data: BLUEPRINTS });
  }

  if (path === 'papers') {
    return NextResponse.json({ success: true, data: PAPERS });
  }

  if (path === 'users') {
    return NextResponse.json({
      success: true,
      data: USERS,
      pagination: { total: USERS.length, page: 1, limit: 50 },
    });
  }

  if (path === 'attempts/history') {
    return NextResponse.json({ success: true, data: ATTEMPTS });
  }

  return NextResponse.json({ success: true, message: `GET /api/v1/${path}`, data: [] });
}

export async function POST(req: NextRequest, { params }: { params: { route: string[] } }) {
  const path = params.route.join('/');
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    // Empty body
  }

  // ── Auth Login ──
  if (path === 'auth/login') {
    const { email, password } = body;
    let user = USERS.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      const role = email?.includes('admin') ? 'ADMIN' : email?.includes('student') ? 'STUDENT' : 'FACULTY';
      user = {
        id: `usr-${Date.now()}`,
        email: email || 'faculty@srmrmp.edu.in',
        name: email?.includes('admin') ? 'Dr. Ramesh Kumar (Admin)' : email?.includes('student') ? 'Jerome Student' : 'Prof. Ananya Sharma',
        role,
        department: 'CSE',
        createdAt: new Date().toISOString(),
      };
      USERS.push(user);
    }

    const token = `qpforge-token-${Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role })).toString('base64')}`;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken: token,
      },
    });
  }

  // ── Auth Register ──
  if (path === 'auth/register') {
    const newUser = {
      id: `usr-${Date.now()}`,
      email: body.email,
      name: body.name || 'Academic User',
      role: body.role || 'FACULTY',
      department: body.department || 'CSE',
      createdAt: new Date().toISOString(),
    };
    USERS.push(newUser);
    const token = `qpforge-token-${Buffer.from(JSON.stringify(newUser)).toString('base64')}`;
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: { user: newUser, accessToken: token },
    });
  }

  // ── Create Custom Subject ──
  if (path === 'subjects') {
    const newSubject = {
      id: `sub-${Date.now()}`,
      code: body.code || 'CUSTOM101',
      name: body.name || 'Custom Subject',
      semester: Number(body.semester) || 1,
      departmentId: body.departmentId || 'dept-1',
      department: { name: body.departmentName || 'Engineering & Technology' },
      units: body.units || [
        { id: `u-${Date.now()}-1`, name: 'Unit 1: Fundamentals', order: 1 },
        { id: `u-${Date.now()}-2`, name: 'Unit 2: Advanced Topics', order: 2 },
      ],
      courseOutcomes: body.courseOutcomes || [
        { id: `co-${Date.now()}-1`, code: 'CO1', description: 'Understand core domain concepts' },
        { id: `co-${Date.now()}-2`, code: 'CO2', description: 'Apply principles to engineering problems' },
      ],
    };
    SUBJECTS.push(newSubject);
    return NextResponse.json({ success: true, data: newSubject });
  }

  // ── Create Question ──
  if (path === 'questions') {
    const sub = SUBJECTS.find(s => s.id === body.subjectId) || SUBJECTS[0];
    const unit = sub.units.find(u => u.id === body.unitId) || sub.units[0];
    const newQuestion = {
      id: `q-${Date.now()}`,
      subjectId: sub.id,
      unitId: unit?.id,
      subject: { code: sub.code, name: sub.name },
      unit: { name: unit?.name || 'General' },
      text: body.text,
      type: body.type || 'SHORT_ANSWER',
      marks: Number(body.marks) || 5,
      difficulty: body.difficulty || 'MEDIUM',
      bloomLevel: body.bloomLevel || 'UNDERSTAND',
      options: body.options || [],
      modelAnswer: body.modelAnswer || 'Standard model answer & marking key.',
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    QUESTIONS.unshift(newQuestion);
    return NextResponse.json({ success: true, data: newQuestion });
  }

  // ── Bulk Create / Import Questions ──
  if (path === 'questions/bulk' || path === 'questions/import') {
    const list = Array.isArray(body.questions) ? body.questions : Array.isArray(body) ? body : [];
    const inserted = [];
    for (const item of list) {
      const sub = SUBJECTS.find(s => s.id === item.subjectId || s.code === item.subjectCode) || SUBJECTS[0];
      const unit = sub.units.find(u => u.id === item.unitId || u.name === item.unitName) || sub.units[0];
      const qObj = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        subjectId: sub.id,
        unitId: unit?.id,
        subject: { code: sub.code, name: sub.name },
        unit: { name: unit?.name || 'General' },
        text: item.text || item.question,
        type: item.type || 'SHORT_ANSWER',
        marks: Number(item.marks) || 5,
        difficulty: item.difficulty || 'MEDIUM',
        bloomLevel: item.bloomLevel || 'UNDERSTAND',
        options: item.options || [],
        modelAnswer: item.modelAnswer || 'Standard model answer & marking key.',
        usageCount: 0,
        createdAt: new Date().toISOString(),
      };
      QUESTIONS.unshift(qObj);
      inserted.push(qObj);
    }
    return NextResponse.json({ success: true, count: inserted.length, data: inserted });
  }

  // ── Create Blueprint ──
  if (path === 'blueprints') {
    const sub = SUBJECTS.find(s => s.id === body.subjectId) || SUBJECTS[0];
    const newBp = {
      id: `bp-${Date.now()}`,
      name: body.name,
      type: body.type || 'CUSTOM',
      subjectId: sub.id,
      subject: { code: sub.code, name: sub.name },
      totalMarks: Number(body.totalMarks) || 100,
      duration: Number(body.duration) || 180,
      sections: body.sections || [],
      createdAt: new Date().toISOString(),
    };
    BLUEPRINTS.unshift(newBp);
    return NextResponse.json({ success: true, data: newBp });
  }

  // ── Notes AI Question Generator ──
  if (path === 'notes/generate') {
    const text = body.text || 'Core engineering syllabus concepts';
    const num = Math.min(Number(body.numQuestions) || 5, 8);
    const type = body.questionType || 'MCQ';
    const difficulty = body.difficulty || 'Medium';
    const bloomLevel = body.bloomLevel || 'Apply';

    const generated = [];
    for (let i = 1; i <= num; i++) {
      if (type === 'MCQ') {
        generated.push({
          question: `Regarding ${text.slice(0, 30)}... Question #${i}: What is the primary characteristic?`,
          type: 'MCQ',
          difficulty,
          bloomLevel,
          marks: 2,
          options: [
            { label: 'A', text: `Option A: Guaranteed $O(\\log N)$ convergence`, isCorrect: true },
            { label: 'B', text: `Option B: Linear space degradation $O(N)$`, isCorrect: false },
            { label: 'C', text: `Option C: Unbounded recursion stack`, isCorrect: false },
            { label: 'D', text: `Option D: None of the above`, isCorrect: false },
          ],
          modelAnswer: 'Option A is mathematically optimal under standard conditions.',
        });
      } else {
        generated.push({
          question: `Explain the fundamental principles of ${text.slice(0, 40)}... (Part ${i}). Derive key formulas and state assumptions.`,
          type,
          difficulty,
          bloomLevel,
          marks: type === 'Long Answer' ? 13 : 5,
          modelAnswer: 'Comprehensive explanation with step-by-step breakdown and relevant academic diagrams.',
        });
      }
    }
    return NextResponse.json({ success: true, data: { questions: generated } });
  }

  // ── Generate Paper / Create Custom Paper ──
  if (path === 'papers/generate' || path === 'papers') {
    const subjectCode = body.customSubjectCode || body.subject?.code || body.subjectCode;
    const subjectName = body.customSubjectName || body.subject?.name || body.subjectName;

    let sub;
    if (subjectCode) {
      sub = {
        id: `sub-${Date.now()}`,
        code: subjectCode,
        name: subjectName || subjectCode,
        semester: 1,
        departmentId: 'dept-1',
        department: { name: body.departmentName || 'Engineering & Technology' },
        units: [{ id: `u-${Date.now()}`, name: 'Unit 1: Core Fundamentals', order: 1 }],
        courseOutcomes: [{ id: `co-${Date.now()}`, code: 'CO1', description: 'Master core concepts' }],
      };
      if (!SUBJECTS.some(s => s.code.toLowerCase() === subjectCode.toLowerCase())) {
        SUBJECTS.push(sub);
      }
    } else {
      sub = SUBJECTS.find(s => s.id === body.subjectId) || SUBJECTS[0];
    }

    const bp = BLUEPRINTS.find(b => b.id === body.blueprintId) || BLUEPRINTS[0];

    // Check if custom questions were provided to also save in repository
    if (body.saveToBank && Array.isArray(body.customQuestions) && body.customQuestions.length > 0) {
      for (const item of body.customQuestions) {
        const qObj = {
          id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          subjectId: sub.id,
          unitId: sub.units[0]?.id || 'u-1',
          subject: { code: sub.code, name: sub.name },
          unit: { name: 'General' },
          text: item.text || item.question,
          type: item.type || 'SHORT_ANSWER',
          marks: Number(item.marks) || 5,
          difficulty: item.difficulty || 'MEDIUM',
          bloomLevel: item.bloomLevel || 'UNDERSTAND',
          options: item.options || [],
          modelAnswer: item.modelAnswer || 'Standard model answer & marking key.',
          usageCount: 1,
          createdAt: new Date().toISOString(),
        };
        QUESTIONS.unshift(qObj);
      }
    }

    // If custom sections were passed directly, use them!
    let generatedSections = [];
    if (Array.isArray(body.sections) && body.sections.length > 0) {
      generatedSections = body.sections.map((sec: any, idx: number) => ({
        name: sec.name || `Section ${idx + 1}`,
        totalMarks: sec.totalMarks || (sec.questions || []).reduce((sum: number, q: any) => sum + (Number(q.marks) || 2), 0),
        questions: sec.questions || [],
      }));
    } else {
      // Intelligently assemble questions matching the blueprint sections
      generatedSections = (bp.sections || [
        { name: 'Part A - Objective Questions', numQuestions: 5, marksPerQuestion: 2 },
        { name: 'Part B - Core Problems', numQuestions: 3, marksPerQuestion: 13 },
      ]).map((sec: any, idx: number) => {
        let matching = QUESTIONS.filter(q => q.subjectId === sub.id || true);
        if (sec.questionType) {
          const typeMatch = matching.filter(q => q.type === sec.questionType);
          if (typeMatch.length > 0) matching = typeMatch;
        }
        
        const count = Math.min(sec.numQuestions || 3, matching.length);
        const selected = matching.slice(0, count).map(q => ({
          ...q,
          marks: sec.marksPerQuestion || q.marks,
        }));

        return {
          name: sec.name || `Section ${idx + 1}`,
          totalMarks: selected.reduce((sum, q) => sum + (q.marks || 2), 0) || (sec.numQuestions * sec.marksPerQuestion),
          questions: selected.length > 0 ? selected : QUESTIONS.slice(0, 3),
        };
      });
    }

    const calculatedTotal = generatedSections.reduce((sum: number, s: any) => sum + (s.totalMarks || 0), 0);

    const newPaper = {
      id: `paper-${Date.now()}`,
      title: body.title || `${sub.code} - Question Paper`,
      type: body.type || bp?.type || 'CUSTOM',
      subject: { code: sub.code, name: sub.name },
      blueprint: { name: bp?.name || 'Custom Question Bank Assembly' },
      totalMarks: body.totalMarks || calculatedTotal || bp?.totalMarks || 100,
      duration: body.duration || bp?.duration || 180,
      status: 'FINALIZED',
      setsCount: body.sets?.length || body.setsCount || 2,
      sections: generatedSections,
      institutionName: body.institutionName || 'SRM Institute of Science & Technology',
      departmentName: body.departmentName || 'Department of Computer Science & Engineering',
      instructions: body.instructions || 'Answer all questions according to Section specifications.',
      createdAt: new Date().toISOString(),
    };

    PAPERS.unshift(newPaper);

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        ...newPaper,
      },
    });
  }

  // ── Clone Paper ──
  if (path.includes('/clone')) {
    const paperId = path.split('/')[1];
    const source = PAPERS.find(p => p.id === paperId) || PAPERS[0];
    const clone = {
      ...source,
      id: `paper-${Date.now()}`,
      title: `${source.title} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    PAPERS.unshift(clone);
    return NextResponse.json({ success: true, data: clone });
  }

  // ── Export Paper ──
  if (path.includes('/export')) {
    return NextResponse.json({
      success: true,
      message: 'Paper exported successfully',
      data: {
        docxUrl: '#',
        pdfUrl: '#',
        answerKeyUrl: '#',
      },
    });
  }

  // ── Student Practice Submit ──
  if (path === 'attempts') {
    const newAttempt = {
      id: `att-${Date.now()}`,
      title: body.title || 'Data Structures Practice Test',
      subjectCode: 'CS201',
      subjectName: 'Data Structures & Algorithms',
      score: body.score || 18,
      maxScore: body.maxScore || 20,
      percentage: Math.round(((body.score || 18) / (body.maxScore || 20)) * 100),
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
    };
    ATTEMPTS.unshift(newAttempt);
    return NextResponse.json({ success: true, data: newAttempt });
  }

  return NextResponse.json({ success: true, message: `POST /api/v1/${path}` });
}

export async function DELETE(req: NextRequest, { params }: { params: { route: string[] } }) {
  const path = params.route.join('/');

  if (path.startsWith('questions/')) {
    const id = path.split('/')[1];
    QUESTIONS = QUESTIONS.filter(q => q.id !== id);
    return NextResponse.json({ success: true, message: 'Question deleted' });
  }

  if (path.startsWith('blueprints/')) {
    const id = path.split('/')[1];
    BLUEPRINTS = BLUEPRINTS.filter(b => b.id !== id);
    return NextResponse.json({ success: true, message: 'Blueprint deleted' });
  }

  if (path.startsWith('papers/')) {
    const id = path.split('/')[1];
    PAPERS = PAPERS.filter(p => p.id !== id);
    return NextResponse.json({ success: true, message: 'Paper deleted' });
  }

  if (path.startsWith('users/')) {
    const id = path.split('/')[1];
    USERS = USERS.filter(u => u.id !== id);
    return NextResponse.json({ success: true, message: 'User deleted' });
  }

  return NextResponse.json({ success: true, message: `DELETE /api/v1/${path}` });
}
