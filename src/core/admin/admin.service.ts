import { prisma } from '../../infrastructure/database/prisma.client';
import { ConflictError, NotFoundError } from '../../common/errors/app.error';
import bcrypt from 'bcryptjs';
import type { CreateDoctorInput } from './admin.types';

export class AdminService {
  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        where: { deletedAt: null },
        select: {
          id: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return { users, total, page, limit };
  }

  async createDoctor(input: CreateDoctorInput) {
    const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existing) throw new ConflictError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        phone: input.phone,
        password: hashedPassword,
        role: 'DOCTOR',
        isVerified: true,
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        specialization: input.specialization,
        licenseNumber: input.licenseNumber,
        bio: input.bio,
      },
    });

    return doctor;
  }

  async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('Foydalanuvchi');

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Foydalanuvchi o\'chirildi' };
  }
}
