import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/modules/prisma/prisma.service';
import * as cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
    
    // Clean up DB before tests
    await prisma.verification.deleteMany();
    await prisma.signature.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  describe('/api/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('should reject registration if email exists', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login the user and return a cookie', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send(testUser)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          const cookies = res.headers['set-cookie'];
          expect(cookies).toBeDefined();
          expect(cookies[0]).toContain('jwt=');
          expect(cookies[0]).toContain('HttpOnly');
        });
    });

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('should clear the jwt cookie', () => {
      return request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(200)
        .expect((res) => {
          const cookies = res.headers['set-cookie'];
          expect(cookies).toBeDefined();
          expect(cookies[0]).toContain('jwt=;');
        });
    });
  });
});
