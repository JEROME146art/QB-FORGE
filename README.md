# QPForge – Smart Question Paper Generator

A complete, production-quality full-stack web application for educational institutions to create, manage, and export question papers efficiently.

## Overview

QPForge enables faculty to build a question bank, upload notes, auto-generate balanced question papers from blueprints, edit them, and export print-ready PDF/DOCX papers with answer keys. Students can use it for practice tests.

## Architecture

### Frontend (Next.js 14)
- **Framework**: App Router with TypeScript
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **State Management**: React Context + TanStack Query
- **Routing**: Next.js App Router with role-based access
- **Features**: Dark/light theme, responsive design, real-time validation

### Backend (Node.js + Express)
- **Framework**: Express with TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT with refresh tokens, bcrypt password hashing
- **AI Integration**: Claude API for question generation
- **File Handling**: Multer with validation (PDF, DOCX, PPTX, TXT, CSV, XLSX)
- **Export**: Puppeteer for PDF, docx library for Word files

### Database Schema
- Users, Departments, Subjects, Programs
- Units, Course Outcomes, Questions (with rich text/LaTeX support)
- Notes, Blueprints, Papers, PaperSets, Attempts, AuditLogs
- Complete constraint satisfaction for paper generation

### AI Question Generation
- Claude API integration for automated question creation
- Support for MCQ, Short Answer, Long Answer, Fill in the blanks, True/False, Numerical, Case Study
- Review screen for faculty approval before saving to bank

### Paper Generation Algorithm
- Smart constraint satisfaction with backtracking
- Support for Semester Exam, CAT, and Custom blueprints
- Unit coverage, Bloom's distribution, difficulty constraints
- Generate multiple sets (A, B, C) with balanced difficulty

## Features

### Authentication & Roles
- Admin: manages users, departments, subjects, system settings
- Faculty: manages question bank, uploads notes, generates and exports papers
- Student: takes practice tests and views results

### Academic Structure
- Departments, Programs, Semesters, Subjects with codes and names
- Units/Modules and Course Outcomes (CO1 to CO5)
- Full CRUD with soft delete and audit logging

### Question Bank Management
- Rich text editor with LaTeX math support
- All question types: MCQ, Short Answer, Long Answer, Fill in the blanks, True/False, Numerical, Case study
- Bulk import from CSV/Excel with row-level error reporting
- Duplicate detection, usage tracking, soft delete

### Notes to Questions (AI Module)
- Upload and extract text from PDF, DOCX, PPTX, TXT
- Generate questions with Claude API based on settings
- Review screen for approval, editing, or rejection

### Paper Blueprint and Generator
- Preset templates: Semester Exam (100 marks), CAT/Internal Test (50 marks)
- Custom blueprint builder with sections, marks per question, choices
- Constraints: unit coverage, Bloom's distribution, difficulty, total marks
- Smart selection algorithm with constraint satisfaction

### Export and Printing
- College header (logo, name, department, subject details)
- Professional exam formatting with CO and Bloom's columns
- Export as PDF and DOCX; separate Answer Key and Marking Scheme

### Student Practice Mode
- Timed online tests with auto-submit and auto-grading
- Result pages with score breakdown

### Analytics Dashboard
- Charts for questions by unit, difficulty, and Bloom's level
- Papers generated over time, most/least used questions
- Syllabus coverage heatmap, student performance trends

## Technology Stack

### Frontend
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui components
- Framer Motion for animations
- Recharts for data visualization

### Backend
- Node.js + Express + TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication + bcrypt
- Multer for file uploads
- Claude API for AI generation
- Puppeteer + docx for export

### DevOps
- Docker + docker-compose
- GitHub Actions CI/CD
- Environment-based configuration
- Rate limiting and security headers

### Testing
- Jest + Supertest (backend)
- React Testing Library (frontend)
- Comprehensive unit and integration tests

## Project Structure

```
qpforge/
├── server/                    # Backend
│   ├── src/
│   │   ├── config/            # Environment and DB config
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── controllers/       # Route handlers
│   │   ├── services/          # Business logic
│   │   │   ├── paperGenerator  # Smart constraint solver
│   │   │   ├── aiService       # Claude integration
│   │   │   ├── exportService   # PDF/DOCX generation
│   │   │   └── textExtraction # File parsing
│   │   ├── routes/            # Express routes
│   │   ├── repositories/      # Database access
│   │   ├── types/             # Type definitions
│   │   └── utils/              # Helper functions
│   ├── prisma/                # Database schema
│   ├── Dockerfile            # Containerization
│   └── package.json
│
├── client/                     # Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/         # UI components
│   │   │   ├── ui/             # shadcn/ui primitives
│   │   │   ├── layout/         # Header, Sidebar, Footer
│   │   │   ├── dashboard/      # Analytics and overview
│   │   │   ├── faculty/        # Question bank, papers, notes
│   │   │   ├── student/        # Practice tests
│   │   │   └── admin/          # User and system management
│   │   ├── lib/               # API client and utilities
│   │   └── hooks/             # Custom React hooks
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── public/
│
├── shared/                     # Common types and schemas
│   └── schema.prisma
│
├── docker-compose.yml           # Development environment
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore
│
├── docs/                       # Documentation
│   ├── architecture.md         # System architecture overview
│   ├── api.md                  # API documentation
│   └── report-outline.md        # Research report outline
│
└── tests/                      # Test suite
    ├── server/                 # Backend tests
    └── client/                  # Frontend tests
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional for local development)

### Installation

#### Clone and Install
```bash
git clone <repo-url> qpforge
cd qpforge
cp .env.example .env
```

#### Install Dependencies
```bash
# Backend
cd server
npm ci

# Frontend
cd ../client
npm ci
```

#### Database Setup
```bash
# Generate Prisma client
cd ../server
npx prisma generate

# Push schema (development)
npx prisma db push

# Run seeds (adds sample data)
npx ts-node src/seeds/index.ts
```

#### Run Development
```bash
# Start backend
# In one terminal
cd server
npm run dev

# Start frontend
# In another terminal
cd client
npm run dev
```

#### Docker Development
```bash
cd qpforge
docker-compose up -d
```

## Running Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## Key Features Implemented

### Phase 1: Core Infrastructure
- Complete database schema with 8+ entities and relationships
- Authentication system with JWT and role-based access control
- RESTful API with comprehensive error handling
- Docker setup for isolated development environment

### Phase 2: Question Bank Management
- Rich text editor with LaTeX support for mathematical expressions
- Bulk import/export with CSV/Excel support
- Advanced search, filter, and pagination
- Question analytics and usage tracking

### Phase 3: AI-Powered Question Generation
- Claude API integration for automated question creation
- Multi-format note support (PDF, DOCX, PPTX, TXT)
- Review interface for faculty approval
- Configurable generation parameters (difficulty, type, marks)

### Phase 4: Smart Paper Generation
- Preset templates for Semester Exam and CAT
- Custom blueprint builder with constraint satisfaction
- Multi-set generation (A, B, C) with balanced difficulty
- Live preview and drag-and-drop reordering

### Phase 5: Export & Printing
- Professional exam formatting with college branding
- PDF export via Puppeteer
- DOCX export via docx library
- Separate answer key and marking scheme documents

### Phase 6: Student & Admin Features
- Student practice mode with timed tests
- Admin dashboard for user and system management
- Analytics dashboard with charts and visualizations
- Comprehensive audit logging

## Security Features

- **Authentication**: JWT with access/refresh tokens, bcrypt password hashing
- **Authorization**: Role-based access control (ADMIN, FACULTY, STUDENT)
- **Input Validation**: Zod schema validation for all endpoints
- **File Upload**: MIME type and size validation, virus scanning
- **API Security**: Rate limiting, CORS, security headers (helmet)
- **Database**: SQL injection protection, parameterized queries
- **Audit**: Complete audit log of all system actions

## Testing Strategy

### Backend Tests
- Unit tests for all services and repositories
- Integration tests for API endpoints
- Database schema validation
- AI service mock testing

### Frontend Tests
- Component tests with React Testing Library
- Integration tests for user flows
- Accessibility testing (WCAG AA)
- Performance testing and bundle analysis

### E2E Tests
- User journey testing (paper creation, generation, export)
- Role-based access testing
- API contract testing

## Deployment

### Local Development
```bash
docker-compose up -d
```

### Production
```bash
# Build and deploy with Docker
# or deploy to cloud platforms (AWS, GCP, Azure)
# Configure reverse proxy (nginx)
# Set up PostgreSQL database
# Configure environment variables
```

## Project Report Outline

### Abstract
### Problem Statement
### Objectives
### Literature Survey
### System Architecture
### Database Design (ER Diagram)
### Implementation Details
### Testing Results
### Conclusion
### Future Enhancements
### Viva Questions

## License

This project is for educational purposes only. Copyright © 2026 SRM University.

## Support

For technical issues, contact: <support@srmrmp.edu.in>

---

**QPForge** - Making exam creation smarter, faster, and more professional.

> “Technology can help make the impossible real; but it can’t replace the human touch in education.”