import type { FastifyInstance } from 'fastify';
import { PatientService } from '../../core/patients/patient.service';
import { jwtGuard } from '../../common/guards/jwt.guard';

const patientService = new PatientService();

const securedSchema = {
  security: [{ bearerAuth: [] }],
  tags: ['Patients'],
};

export async function patientRoutes(app: FastifyInstance) {
  app.get('/me', {
    schema: {
      ...securedSchema,
      summary: 'O\'z profilimni ko\'rish',
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
    const patient = await patientService.getMe(userId);
    return reply.send({ success: true, data: patient });
  });

  app.put('/me', {
    schema: {
      ...securedSchema,
      summary: 'Profilni yangilash',
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string', example: 'Ali' },
          lastName: { type: 'string', example: 'Valiyev' },
          dateOfBirth: { type: 'string', format: 'date', example: '1995-03-15' },
          gender: { type: 'string', enum: ['MALE', 'FEMALE'] },
          address: { type: 'string', example: 'Toshkent, Chilonzor' },
          bloodType: { type: 'string', example: 'A+' },
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
    const body = request.body as any;
    if (body.dateOfBirth) body.dateOfBirth = new Date(body.dateOfBirth);
    const patient = await patientService.updateMe(userId, body);
    return reply.send({ success: true, data: patient });
  });
}
