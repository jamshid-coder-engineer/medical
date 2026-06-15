import type { JwtPayload } from '../../core/auth/auth.types';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}
