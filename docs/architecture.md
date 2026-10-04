# QPForge System Architecture

## Overview

QPForge follows a modern **three-tier architecture**:
1. **Presentation Layer** – Next.js frontend (App Router)
2. **Application Layer** – Express REST API with TypeScript
3. **Data Layer** – PostgreSQL + Prisma ORM

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Landing Page │  │  Dashboard   │  │  Paper Generation     │  │
│  │  (Hero/Features)│  │  (Role-based)│  │  (Wizard + Preview)  │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Question    │  │  Practice    │  │  Analytics Dashboard   │  │
│  │  Bank        │  │  Mode        │  │  (Recharts)           │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (JSON)
                            │ JWT Bearer Token
┌───────────────────────────▼─────────────────────────────────────┐
│                      SERVER (Express + TypeScript)              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Middleware  │  │  Controllers │  │  Services              │  │
│  │  - Auth      │  │  - Auth      │  │  - PaperGenerator     │  │
│  │  - Rate Limit│  │  - Questions │  │  - AI (Claude)        │  │
│  │  - CORS      │  │  - Papers    │  │  - Export (PDF/DOCX)  │  │
│  │  - Helmet    │  │  - Notes     │  │  - Text Extraction    │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma Client
┌───────────────────────────▼─────────────────────────────────────┐
│                    DATABASE (PostgreSQL 16)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Users       │  │  Subjects    │  │  Questions             │  │
│  │  - Role      │  │  - Code      │  │  - Type               │  │
│  │  - Password  │  │  - Semester  │  │  - Difficulty         │  │
│  │  - Profile   │  │  - COs       │  │  - Bloom's Level      │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Blueprint   │  │  Papers      │  │  Attempts              │  │
│  │  - Sections  │  │  - Sets      │  │  - Student            │  │
│  │  - Constraints│  │  - Meta     │  │  - Score              │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Notes       │  │  AuditLogs   │  │  Course Outcomes       │  │
│  │  - File path │  │  - Action    │  │  - CO1 to CO5          │  │
│  │  - Extracted │  │  - Metadata  │  │                        │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Presentation Layer (Next.js)
- Server Components for initial data fetching
- Client Components for interactivity (forms, modals, drag-drop)
- Server Actions for mutations
- Responsive design with Tailwind CSS
- Accessibility (WCAG AA) compliance

### Application Layer (Express + TypeScript)
- **Controllers**: Handle HTTP requests/responses, input validation with Zod
- **Services**: Business logic, external API calls (Claude), file processing
- **Repositories**: Database operations with Prisma
- **Middleware**: Authentication, authorization, rate limiting, error handling
- **Routes**: Centralized routing with proper HTTP method mapping

### Data Layer (PostgreSQL + Prisma)
- 15+ models with proper relations
- Enums for type safety
- Indexes for query performance
- Soft delete support for all entities
- Audit trail via AuditLog table

## Security Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                            │
├──────────────────────────────────────────────────────────────┤
│  1. HTTPS (TLS 1.3)                                         │
│  2. JWT Authentication (access + refresh tokens)            │
│  3. Role-Based Access Control (RBAC)                        │
│  4. Input Validation (Zod schemas)                          │
│  5. Rate Limiting (express-rate-limit)                      │
│  6. Security Headers (helmet)                               │
│  7. SQL Injection Protection (Prisma parameterized queries) │
│  8. XSS Protection (input sanitization)                     │
│  9. File Upload Validation (type + size + MIME)             │
│  10. CORS Configuration                                    │
│  11. Audit Logging                                         │
│  12. Password Hashing (bcrypt with salt rounds = 10)       │
└──────────────────────────────────────────────────────────────┘
```

## AI Integration

```
┌──────────────────────────────────────────────────────────────┐
│                    AI QUESTION GENERATION                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  User Upload ──▶ Text Extraction ──▶ Claude API ──▶ Review   │
│     │              │                │             │          │
│     │              │                │             │          │
│     │              ▼                ▼             ▼          │
│     │         Unit/Topic Split  JSON Output  Faculty Review   │
│     │              │                │             │          │
│     │              ▼                ▼             ▼          │
│     │         Content Chunking  Zod Schema    Approve/Edit/  │
│     │              │                │            Reject       │
│     │              ▼                ▼             │          │
│     │         Topic Mapping   Error Handling ─────┘          │
│     │              │                │                        │
│     └──────────────┴────────────────┘                        │
│                      │                                       │
│                      ▼                                       │
│              Save to Question Bank                           │
└──────────────────────────────────────────────────────────────┘
```

## Paper Generation Algorithm

The paper generation algorithm uses a **two-pass constraint satisfaction approach**:

### Pass 1: Parallel Section Generation
- For each blueprint section, compute required question counts
- Use weighted random selection based on difficulty and Bloom's level
- Track used questions to avoid duplicates within a set

### Pass 2: Cross-Section Sanitization
- Verify global constraints (unit coverage, CO coverage)
- Re-generate sections that violate constraints
- Return detailed explanation if constraints cannot be met

### Constraint Types
1. **Unit Coverage**: Each unit must appear in ≥ X% of questions
2. **Difficulty Distribution**: Configurable % for Easy/Medium/Hard
3. **Bloom's Distribution**: Configurable % for each level
4. **CO Coverage**: Each CO must appear in at least one question
5. **Total Marks**: Must match blueprint total exactly
6. **No Recent Duplicates**: Avoid questions used in recent papers

## Performance Considerations

- **Database Indexes**: All foreign keys and common query fields indexed
- **Query Optimization**: Prisma `include` for eager loading where needed
- **Pagination**: Cursor-based pagination for large datasets
- **Caching**: Redis for frequently accessed data (optional)
- **File Processing**: Streaming for large file uploads
- **AI Rate Limiting**: Queue for Claude API requests

## Scalability

- **Horizontal Scaling**: Stateless backend, load balancer ready
- **Database**: Read replicas for analytics queries
- **File Storage**: S3-compatible object storage (optional)
- **Queue**: Bull Queue for background jobs (PDF generation, AI tasks)
- **CDN**: Static assets served via CDN

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Load Balancer]                                             │
│       │                                                      │
│       ├──────────────────────────────────────────────┐       │
│       ▼              ▼              ▼               │       │
│  [Server 1]    [Server 2]    [Server N]              │       │
│  (Express)      (Express)     (Express)              │       │
│       │              │              │                │       │
│       └──────────────┴──────────────┘                │       │
│                      │                               │       │
│                      ▼                               │       │
│              [PostgreSQL Primary]                     │       │
│                      │                               │       │
│                      ▼                               │       │
│              [PostgreSQL Replica]                     │       │
│                      │                               │       │
│                      ▼                               │       │
│              [Redis Cache]                           │       │
│                      │                               │       │
│                      ▼                               │       │
│              [S3 Storage]                            │       │
└──────────────────────────────────────────────────────────────┘
```

## Technology Decisions

### Why Next.js?
- Full-stack React framework with Server Components
- Excellent SEO for landing page
- Built-in API routes (used for simpler endpoints)
- Strong ecosystem (shadcn/ui, Tailwind)

### Why Express?
- Mature, well-documented REST API framework
- Better control over middleware pipeline
- Easier to integrate with Claude API
- Smaller bundle size than full-stack frameworks

### Why PostgreSQL?
- ACID compliance for academic data integrity
- Strong relational capabilities for complex queries
- JSON support for flexible metadata
- Excellent Prisma support

### Why Claude API?
- Superior reasoning for question generation
- Better instruction following (JSON output)
- Context window supports long notes
- Cost-effective for educational use

## Future Enhancements

1. **Real-time Collaboration**: WebSocket support for concurrent editing
2. **Machine Learning**: ML-based question difficulty prediction
3. **Natural Language**: Chat-based paper generation ("Create a paper on arrays")
4. **Integration**: LMS integration (Canvas, Moodle, Blackboard)
5. **Mobile App**: React Native for on-the-go access
6. **Analytics**: Advanced student performance prediction
7. **AI Feedback**: Automated grading with explanations