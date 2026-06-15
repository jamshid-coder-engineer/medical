import type { FastifyInstance } from 'fastify';
import { RecordService } from '../../core/records/record.service';
import { jwtGuard } from '../../common/guards/jwt.guard';

const recordService = new RecordService();

const securedSchema = {
  security: [{ bearerAuth: [] }],
  tags: ['Records'],
};

export async function recordRoutes(app: FastifyInstance) {
  app.get('/my', {
    schema: {
      ...securedSchema,
      summary: 'Mening tibbiy yozuvlarim (bemor uchun)',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    preHandler: jwtGuard,
  }, async (request, reply) => {
    const { userId } = request.user;
    const records = await recordService.getMy(userId);
    return reply.send({ success: true, data: records });
  });

  app.post('/', {
    schema: {
      ...securedSchema,
      summary: 'Tibbiy yozuv yaratish (faqat shifokor)',
      body: {
        type: 'object',
        required: ['patientId', 'diagnosis'],
        properties: {
          patientId: { type: 'string', example: 'patient-uuid' },
          appointmentId: { type: 'string', example: 'appointment-uuid' },
          diagnosis: { type: 'string', example: 'Gripp' },
          prescription: { type: 'string', example: 'Paracetamol 500mg' },
          notes: { type: 'string', example: 'Ko\'proq suv iching' },
          attachments: { type: 'array', items: { type: 'string' } },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    preHandler: jwtGuard,
  }, async (request, reply) => {
    const { userId } = request.user;
    const body = request.body as any;
    const record = await recordService.create(userId, body);
    return reply.status(201).send({ success: true, data: record });
  });
}
