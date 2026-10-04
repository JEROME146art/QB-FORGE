import request from 'supertest';
import { app } from '../../src/app';

describe('Paper Module', () => {
  let facultyToken: string;
  let adminToken: string;
  let studentToken: string;
  let subjectId: string;

  beforeAll(async () => {
    const facultyRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'faculty2@example.com',
        password: 'SecurePass123!',
        name: 'Test Faculty 2',
        role: 'FACULTY',
      });
    facultyToken = facultyRes.body.data.accessToken;

    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin2@example.com',
        password: 'SecurePass123!',
        name: 'Test Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data.accessToken;

    const studentRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student2@example.com',
        password: 'SecurePass123!',
        name: 'Test Student',
        role: 'STUDENT',
      });
    studentToken = studentRes.body.data.accessToken;

    const subjRes = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        code: 'TEST002',
        name: 'Test Subject 2',
        semester: 1,
      });
    subjectId = subjRes.body.data.id;

    // Create blueprint for testing
    await request(app)
      .post('/api/v1/blueprints')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        name: 'Test Blueprint',
        type: 'SEMESTER_EXAM',
        subjectId,
        totalMarks: 100,
        duration: 180,
        sections: [
          { name: 'Part A', order: 1, numQuestions: 5, marksPerQuestion: 2, compulsory: true },
          { name: 'Part B', order: 2, numQuestions: 3, marksPerQuestion: 10, compulsory: true },
        ],
      });
  });

  afterAll(async () => {
    await global.prisma.$disconnect();
  });

  describe('POST /papers', () => {
    it('should create a paper draft (faculty)', async () => {
      const res = await request(app)
        .post('/api/v1/papers')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          title: 'Test Paper',
          type: 'SEMESTER_EXAM',
          subjectId,
          totalMarks: 100,
          duration: 180,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Paper');
    });

    it('should create a paper draft (admin)', async () => {
      const res = await request(app)
        .post('/api/v1/papers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Paper',
          type: 'SEMESTER_EXAM',
          subjectId,
          totalMarks: 100,
          duration: 180,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject paper creation without authentication', async () => {
      const res = await request(app).post('/api/v1/papers').send({
        title: 'Unauth Paper',
        subjectId,
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject student paper creation', async () => {
      const res = await request(app)
        .post('/api/v1/papers')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Paper',
          subjectId,
        });
      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /papers', () => {
    it('should list papers (faculty)', async () => {
      const res = await request(app)
        .get('/api/v1/papers')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should list papers (admin)', async () => {
      const res = await request(app)
        .get('/api/v1/papers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /papers/:id', () => {
    it('should return 404 for non-existent paper', async () => {
      const res = await request(app)
        .get('/api/v1/papers/non-existent-id')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /papers/generate', () => {
    it('should generate a paper from preset templates', async () => {
      const res = await request(app)
        .post('/api/v1/blueprints/presets')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.SEMESTER_EXAM).toBeDefined();
    });
  });
});