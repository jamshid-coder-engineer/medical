import type { FastifyInstance } from 'fastify';
import { AppointmentService } from '../../core/appointments/appointment.service';
import { jwtGuard } from '../../common/guards/jwt.guard';

const appointmentService = new AppointmentService();

const securedSchema = {
  security: [{ bearerAuth: [] }],
  tags: ['Appointments'],
};

export async function appointmentRoutes(app: FastifyInstance) {
  app.post('/', {
    schema: {
      ...securedSchema,
      summary: 'Qabulga yozilish',
      body: {
        type: 'object',
        required: ['doctorId', 'scheduledAt'],
        properties: {
          doctorId: { type: 'string', example: 'doctor-uuid' },
          scheduledAt: { type: 'string', example: '2026-06-15T10:00:00.000Z' },
          reason: { type: 'string', example: 'Bosh og\'rig\'i' },
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
    const appointment = await appointmentService.create(userId, body);
    return reply.status(201).send({ success: true, data: appointment });
  });

  app.get('/my', {
    schema: {
      ...securedSchema,
      summary: 'Mening qabullarim',
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
    const appointments = await appointmentService.getMy(userId);
    return reply.send({ success: true, data: appointments });
  });

  app.put('/:id', {
    schema: {
      ...securedSchema,
      summary: 'Qabul holatini o\'zgartirish',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'appointment-uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['CANCELLED', 'CONFIRMED', 'COMPLETED'] },
        },
      },
      response: {
        200: {
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
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const appointment = await appointmentService.updateStatus(userId, id, body);
    return reply.send({ success: true, data: appointment });
  });
}
