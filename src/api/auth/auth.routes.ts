import type { FastifyInstance } from 'fastify';
import { AuthService } from '../../core/auth/auth.service';

const authService = new AuthService();

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Ro\'yxatdan o\'tish',
      body: {
        type: 'object',
        required: ['phone', 'password'],
        properties: {
          phone: { type: 'string', example: '+998901234567' },
          password: { type: 'string', minLength: 6, example: 'secret123' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: { message: { type: 'string' } },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as { phone: string; password: string };
    const result = await authService.register(body);
    return reply.status(201).send({ success: true, data: result });
  });

  app.post('/verify-otp', {
    schema: {
      tags: ['Auth'],
      summary: 'OTP kodni tasdiqlash',
      body: {
        type: 'object',
        required: ['phone', 'code'],
        properties: {
          phone: { type: 'string', example: '+998901234567' },
          code: { type: 'string', example: '123456' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: { message: { type: 'string' } },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as { phone: string; code: string };
    const result = await authService.verifyOtp(body);
    return reply.status(200).send({ success: true, data: result });
  });

  app.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Tizimga kirish — JWT token olish',
      body: {
        type: 'object',
        required: ['phone', 'password'],
        properties: {
          phone: { type: 'string', example: '+998901234567' },
          password: { type: 'string', example: 'secret123' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: { accessToken: { type: 'string' } },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as { phone: string; password: string };
    const result = await authService.login(body);

    const token = app.jwt.sign(result.user, { expiresIn: '7d' });

    return reply.status(200).send({
      success: true,
      data: { accessToken: token },
    });
  });
}