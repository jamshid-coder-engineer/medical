import type { FastifyInstance } from 'fastify';
import { AdminService } from '../../core/admin/admin.service';
import { adminGuard } from '../../common/guards/admin.guard';

const adminService = new AdminService();

const securedSchema = {
  security: [{ bearerAuth: [] }],
  tags: ['Admin'],
};

export async function adminRoutes(app: FastifyInstance) {
  app.get('/users', {
    schema: {
      ...securedSchema,
      summary: 'Barcha foydalanuvchilar (admin)',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
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
    preHandler: adminGuard,
  }, async (request, reply) => {
    const { page, limit } = request.query as { page?: number; limit?: number };
    const result = await adminService.getUsers(page, limit);
    return reply.send({ success: true, data: result });
  });

  app.post('/doctors', {
    schema: {
      ...securedSchema,
      summary: 'Yangi shifokor qo\'shish (admin)',
      body: {
        type: 'object',
        required: ['phone', 'password', 'firstName', 'lastName', 'specialization', 'licenseNumber'],
        properties: {
          phone: { type: 'string', example: '+998901234567' },
          password: { type: 'string', example: 'doctor123' },
          firstName: { type: 'string', example: 'Sardor' },
          lastName: { type: 'string', example: 'Toshmatov' },
          specialization: { type: 'string', example: 'Kardiolog' },
          licenseNumber: { type: 'string', example: 'UZ-2024-001' },
          bio: { type: 'string', example: '10 yillik tajriba' },
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
    preHandler: adminGuard,
  }, async (request, reply) => {
    const body = request.body as any;
    const doctor = await adminService.createDoctor(body);
    return reply.status(201).send({ success: true, data: doctor });
  });

  app.delete('/users/:id', {
    schema: {
      ...securedSchema,
      summary: 'Foydalanuvchini o\'chirish (admin, soft delete)',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-uuid' },
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
    preHandler: adminGuard,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await adminService.deleteUser(id);
    return reply.send({ success: true, data: result });
  });
}
