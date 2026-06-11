import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { env } from './config/env';
import { prisma } from './infrastructure/database/prisma.client';
import { AppError } from './common/errors/app.error';
import { authRoutes } from './api/auth/auth.routes';

async function bootstrap() {
  const app = Fastify({
    logger: true,
  });

  // Pluginlar
  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(jwt, { secret: env.JWT_SECRET });

  // Global xato ushlash
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Serverda xatolik yuz berdi',
      },
    });
  });

await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Health check
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  // PostgreSQL ga ulanish
  await prisma.$connect();
  app.log.info('✅ PostgreSQL ga ulandi');

  // Serverni ishga tushirish
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`🚀 Server: http://localhost:${env.PORT}`);

  // Graceful shutdown
  const shutdown = async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();