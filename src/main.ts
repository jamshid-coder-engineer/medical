import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import { env } from './config/env';
import { prisma } from './infrastructure/database/prisma.client';
import { AppError } from './common/errors/app.error';
import { authRoutes } from './api/auth/auth.routes';
import { patientRoutes } from './api/patients/patient.routes';
import { doctorRoutes } from './api/doctors/doctor.routes';
import { appointmentRoutes } from './api/appointments/appointment.routes';
import { fileRoutes } from './api/files/file.routes';
import { recordRoutes } from './api/records/record.routes';
import { adminRoutes } from './api/admin/admin.routes';
import { ensureBucket } from './infrastructure/storage/minio.client';

async function bootstrap() {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: { strict: false },
    },
  });

  // Pluginlar
  await app.register(cors, { origin: true });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(jwt, { secret: env.JWT_SECRET });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Medical Clinic API',
        description: 'Tibbiyot klinikasi backend API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  });

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
  await app.register(patientRoutes, { prefix: '/api/v1/patients' });
  await app.register(doctorRoutes, { prefix: '/api/v1/doctors' });
  await app.register(appointmentRoutes, { prefix: '/api/v1/appointments' });
  await app.register(multipart);
  await app.register(fileRoutes, { prefix: '/api/v1/files' });
  await app.register(recordRoutes, { prefix: '/api/v1/records' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

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

  // MinIO bucket yaratish (yo'q bo'lsa)
  await ensureBucket();
  app.log.info('✅ MinIO bucket tayyor');

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