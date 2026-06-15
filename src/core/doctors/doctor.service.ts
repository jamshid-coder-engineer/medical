import { prisma } from '../../infrastructure/database/prisma.client';
import { NotFoundError } from '../../common/errors/app.error';

export class DoctorService {
  async getAll() {
    return prisma.doctor.findMany({
      where: { deletedAt: null, isAvailable: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        bio: true,
        avatarUrl: true,
        schedules: {
          where: { isActive: true },
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
      },
    });
  }

  async getById(id: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id, deletedAt: null },
      include: {
        schedules: { where: { isActive: true } },
        user: { select: { phone: true } },
      },
    });

    if (!doctor) {
      throw new NotFoundError('Shifokor');
    }

    return doctor;
  }
}
