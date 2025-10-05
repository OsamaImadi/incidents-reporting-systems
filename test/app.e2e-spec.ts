import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        username: 'logintest',
        email: 'logintest@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      // Then login
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('Incidents Management', () => {
    let accessToken: string;
    let userId: number;

    beforeEach(async () => {
      // Register and login a user
      const userData = {
        username: 'incidentuser',
        email: 'incidentuser@example.com',
        password: 'password123',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      accessToken = registerResponse.body.accessToken;
      userId = registerResponse.body.user.id;
    });

    it('should create an incident', async () => {
      const incidentData = {
        url: 'https://malicious-site.com',
        description: 'Malicious website detected',
        severity: 'HIGH',
      };

      const response = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.url).toBe(incidentData.url);
      expect(response.body.description).toBe(incidentData.description);
    });

    it('should get user incidents', async () => {
      // Create an incident first
      const incidentData = {
        url: 'https://malicious-site.com',
        description: 'Malicious website detected',
        severity: 'HIGH',
      };

      await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(incidentData);

      // Get incidents
      const response = await request(app.getHttpServer())
        .get('/incidents')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should search incidents with filters', async () => {
      // Create an incident first
      const incidentData = {
        url: 'https://malicious-site.com',
        description: 'Malicious website detected',
        severity: 'HIGH',
      };

      await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(incidentData);

      // Search with filters
      const response = await request(app.getHttpServer())
        .get('/incidents/search?severity=HIGH')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('incidents');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.incidents)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login endpoint', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'wrongpassword',
      };

      // Make multiple requests to trigger rate limiting
      const promises = Array(6).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData)
      );

      const responses = await Promise.allSettled(promises);
      
      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && result.value.status === 429
      );
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security', () => {
    it('should require authentication for protected endpoints', async () => {
      await request(app.getHttpServer())
        .get('/incidents')
        .expect(401);
    });

    it('should reject requests without proper authorization header', async () => {
      await request(app.getHttpServer())
        .get('/incidents')
        .set('Authorization', 'Invalid token')
        .expect(401);
    });
  });
});