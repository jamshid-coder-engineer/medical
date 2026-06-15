import type { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '../errors/app.error';

export async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  await request.jwtVerify();
  if (request.user.role !== 'ADMIN') {
    throw new ForbiddenError('Faqat adminlar uchun');
  }
}
