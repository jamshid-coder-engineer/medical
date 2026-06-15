import type { FastifyInstance } from 'fastify';
import { jwtGuard } from '../../common/guards/jwt.guard';
import { minioClient, BUCKET_NAME } from '../../infrastructure/storage/minio.client';
import { randomUUID } from 'crypto';
import path from 'path';

export async function fileRoutes(app: FastifyInstance) {
  app.post('/upload', {
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ['Files'],
      summary: 'Fayl yuklash (rasm, hujjat)',
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                fileName: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: jwtGuard,
  }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: { message: 'Fayl topilmadi' } });
    }

    const ext = path.extname(data.filename);
    const fileName = `${randomUUID()}${ext}`;

    await minioClient.putObject(BUCKET_NAME, fileName, data.file, {
      'Content-Type': data.mimetype,
    });

    const url = `/api/v1/files/${fileName}`;

    return reply.send({ success: true, data: { url, fileName } });
  });

  app.get('/:fileName', {
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ['Files'],
      summary: 'Fayl olish',
      params: {
        type: 'object',
        properties: { fileName: { type: 'string' } },
      },
    },
    preHandler: jwtGuard,
  }, async (request, reply) => {
    const { fileName } = request.params as { fileName: string };
    const stream = await minioClient.getObject(BUCKET_NAME, fileName);
    return reply.send(stream);
  });
}
