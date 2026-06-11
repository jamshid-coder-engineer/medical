import type { FastifyInstance } from 'fastify';
import { AuthService } from '../../core/auth/auth.service';

const authService = new AuthService();

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = request.body as { phone: string; password: string };
    const result = await authService.register(body);
    return reply.status(201).send({ success: true, data: result });
  });

  app.post('/verify-otp', async (request, reply) => {
    const body = request.body as { phone: string; code: string };
    const result = await authService.verifyOtp(body);
    return reply.status(200).send({ success: true, data: result });
  });

  app.post('/login', async (request, reply) => {
    const body = request.body as { phone: string; password: string };
    const result = await authService.login(body);

    const token = app.jwt.sign(result.user, {
      expiresIn: '7d',
    });

    return reply.status(200).send({
      success: true,
      data: { accessToken: token },
    });
  });
}