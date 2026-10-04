# QPForge API Documentation

## Base URL
```
http://localhost:4000/api/v1
```

## Authentication
All endpoints except `/auth/register` and `/auth/login` require a Bearer token:
```
Authorization: Bearer <access_token>
```

## Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { },
  "errors": []
}
```

## Error Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## ─── Auth Module ───────────────────────────────────

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePass123",
  "name": "John Doe",
  "role": "FACULTY",
  "departmentId": "dept_123",
  "college": "SRM University"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "..." },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "..."
}
```

**Response:**
```json
{
  "success": true,
  "data": { "accessToken": "..." }
}
```

## ─── Users Module ───────────────────────────────────

### GET /users/profile
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "FACULTY",
    "department": { "id": "...", "name": "CSE", "code": "CSE" }
  }
}
```

### PATCH /users/profile
Update user profile.

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "college": "SRM University",
  "phone": "+91-9876543210"
}
```

### GET /users (Admin only)
List all users with pagination.

**Query Params:** `?page=1&limit=20&role=FACULTY`

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

### DELETE /users/:userId (Admin only)
Delete a user.

### GET /users/audit-logs (Admin only)
Get system audit logs.

## ─── Subjects Module ───────────────────────────────────

### GET /subjects
List all subjects.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "code": "CS201",
      "name": "Data Structures & Algorithms",
      "department": { "id": "...", "name": "CSE" },
      "semester": 2
    }
  ]
}
```

### POST /subjects (Admin/Faculty)
Create a new subject.

**Request Body:**
```json
{
  "code": "CS201",
  "name": "Data Structures & Algorithms",
  "departmentId": "dept_123",
  "semester": 2,
  "description": "Covers arrays, linked lists, trees, graphs..."
}
```

### GET /subjects/:subjectId
Get subject details including units and questions.

## ─── Questions Module ───────────────────────────────────

### POST /questions (Faculty/Admin)
Create a question.

**Request Body:**
```json
{
  "subjectId": "subj_123",
  "unitId": "unit_456",
  "type": "MCQ",
  "text": "What is the time complexity of binary search?",
  "options": [
    { "label": "A", "text": "O(n)", "isCorrect": false },
    { "label": "B", "text": "O(log n)", "isCorrect": true },
    { "label": "C", "text": "O(n log n)", "isCorrect": false },
    { "label": "D", "text": "O(1)", "isCorrect": false }
  ],
  "modelAnswer": "B",
  "marks": 2,
  "difficulty": "EASY",
  "bloomLevel": "REMEMBER",
  "tags": ["arrays", "searching", "binary-search"]
}
```

### GET /questions
List questions with filtering and pagination.

**Query Params:** `?subjectId=subj_123&type=MCQ&difficulty=EASY&search=binary&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
}
```

### GET /questions/stats
Get question statistics by type, difficulty, Bloom's level.

### GET /questions/:questionId
Get a single question with details.

### PATCH /questions/:questionId (Faculty/Admin)
Update a question.

### DELETE /questions/:questionId (Faculty/Admin)
Soft delete a question.

### GET /questions/bulk-import
Bulk import questions from CSV/Excel.

**Request Body:**
```json
{
  "rows": [
    { "subjectCode": "CS201", "unitName": "Arrays", "type": "MCQ", "text": "Question text", "marks": "2", "difficulty": "EASY", "bloomLevel": "REMEMBER", "tags": "arrays,searching" }
  ]
}
```

## ─── Papers Module ───────────────────────────────────

### POST /papers (Faculty/Admin)
Create a paper draft.

### POST /papers/generate (Faculty/Admin)
Generate paper from blueprint with AI-assisted selection.

**Request Body:**
```json
{
  "blueprintId": "bp_123",
  "sets": ["A", "B", "C"]
}
```

### GET /papers
List papers with filtering.

### GET /papers/:paperId
Get paper with all questions and sets.

### PATCH /papers/:paperId (Faculty/Admin)
Update paper.

### DELETE /papers/:paperId (Faculty/Admin)
Delete paper.

### POST /papers/:paperId/export (Faculty/Admin)
Export paper to PDF or DOCX.

**Request Body:**
```json
{ "format": "PDF" }
```

**Response:**
```json
{
  "success": true,
  "data": { "url": "/uploads/paper-abc123.pdf" }
}
```

### POST /papers/:paperId/clone (Faculty/Admin)
Clone a paper (creates a new version).

### POST /papers/swap-question (Faculty/Admin)
Swap a question in a paper with an alternative.

## ─── Blueprints Module ───────────────────────────────────

### POST /blueprints (Faculty/Admin)
Create a blueprint.

**Request Body:**
```json
{
  "name": "CS201 Midterm",
  "type": "SEMESTER_EXAM",
  "subjectId": "subj_123",
  "totalMarks": 100,
  "duration": 180,
  "sections": [
    {
      "name": "Part A",
      "order": 1,
      "numQuestions": 10,
      "marksPerQuestion": 2,
      "questionType": "SHORT_ANSWER",
      "compulsory": true
    },
    {
      "name": "Part B",
      "order": 2,
      "numQuestions": 5,
      "marksPerQuestion": 13,
      "questionType": "SHORT_ANSWER",
      "compulsory": true
    },
    {
      "name": "Part C",
      "order": 3,
      "numQuestions": 1,
      "marksPerQuestion": 15,
      "questionType": "CASE_STUDY",
      "compulsory": true
    }
  ],
  "constraints": {
    "unitCoverage": { "unit1": 20, "unit2": 25, "unit3": 25, "unit4": 15, "unit5": 15 },
    "difficultyDistribution": { "EASY": 30, "MEDIUM": 50, "HARD": 20 },
    "bloomDistribution": { "REMEMBER": 25, "UNDERSTAND": 30, "APPLY": 20, "ANALYZE": 15, "EVALUATE": 5, "CREATE": 5 }
  }
}
```

### GET /blueprints
List blueprints (Faculty sees own, Admin sees all).

### GET /blueprints/presets
Get preset templates (Semester Exam, CAT).

### GET /blueprints/:blueprintId
Get blueprint details.

### DELETE /blueprints/:blueprintId (Faculty/Admin)
Delete a blueprint.

## ─── Notes & AI Module ───────────────────────────────────

### POST /notes/upload (Faculty/Admin)
Upload notes file (PDF, DOCX, PPTX, TXT).

**Content-Type:** multipart/form-data
- `file`: The file to upload
- `title`: Note title
- `subjectId`: Subject ID
- `unitId`: Optional unit ID

**Response:**
```json
{
  "success": true,
  "data": { "id": "...", "title": "...", "filePath": "..." }
}
```

### POST /notes/generate-questions (Faculty/Admin)
Generate questions from uploaded notes using AI.

**Request Body:**
```json
{
  "noteId": "note_123",
  "numQuestions": 20,
  "questionType": "MCQ",
  "difficulty": "MEDIUM",
  "bloomLevel": "UNDERSTAND",
  "marks": 5
}
```

### GET /notes
List notes for a subject.

## ─── Analytics Module ───────────────────────────────────

### GET /analytics/dashboard
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalQuestions": 150,
    "totalPapers": 25,
    "totalUsers": 50,
    "totalAttempts": 200
  }
}
```

### GET /analytics/question-distribution
Get question distribution by unit, difficulty, Bloom's level.

### GET /analytics/paper-trends
Get paper generation trends over time.

### GET /analytics/student-performance
Get student performance data.

## ─── Practice Module ───────────────────────────────────

### POST /attempts/start (Student)
Start a practice attempt.

**Request Body:**
```json
{ "paperSetId": "set_123" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "IN_PROGRESS",
    "paperSet": { "questions": [...] }
  }
}
```

### POST /attempts/submit (Student)
Submit answers for auto-grading.

**Request Body:**
```json
{
  "attemptId": "att_123",
  "answers": [
    { "questionId": "q_1", "answer": "B" },
    { "questionId": "q_2", "answer": "42" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "AUTO_GRADED",
    "score": 18,
    "maxScore": 25,
    "answers": [ ... ]
  }
}
```

### GET /attempts/history (Student)
Get student's attempt history.

### GET /attempts/:attemptId (Student)
Get detailed attempt result.

## ─── WebSocket Events (Future) ──────────────────────────

```
Client → Server: paper:generate   { blueprintId, sets }
Server → Client: paper:generated  { paperId, sets }
Server → Client: paper:error      { message }

Client → Server: question:swap    { paperQuestionId, newQuestionId }
Server → Client: question:swapped { paperQuestionId, newQuestionId }
```