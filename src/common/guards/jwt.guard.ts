import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../errors/app.error';

export async function jwtGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError('Token noto\'g\'ri yoki muddati o\'tgan');
  }
}
