import type { FastifyInstance } from 'fastify';
import { DoctorService } from '../../core/doctors/doctor.service';
import { jwtGuard } from '../../common/guards/jwt.guard';

const doctorService = new DoctorService();

const securedSchema = {
  security: [{ bearerAuth: [] }],
  tags: ['Doctors'],
};

export async function doctorRoutes(app: FastifyInstance) {
  app.get('/', {
    schema: {
      ...securedSchema,
      summary: 'Barcha shifokorlar ro\'yxati',
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
  }, async (_request, reply) => {
    const doctors = await doctorService.getAll();
    return reply.send({ success: true, data: doctors });
  });

  app.get('/:id', {
    schema: {
      ...securedSchema,
      summary: 'Bitta shifokor ma\'lumoti',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-here' },
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
    const { id } = request.params as { id: string };
    const doctor = await doctorService.getById(id);
    return reply.send({ success: true, data: doctor });
  });
}
