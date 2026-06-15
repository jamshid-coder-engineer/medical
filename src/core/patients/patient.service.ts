import { prisma } from '../../infrastructure/database/prisma.client';
import { NotFoundError } from '../../common/errors/app.error';
import type { UpdatePatientInput } from './patient.types';

export class PatientService {
  async getMe(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: { select: { phone: true, role: true, isVerified: true } } },
    });

    if (!patient) {
      throw new NotFoundError('Bemor profili');
    }

    return patient;
  }

  async updateMe(userId: string, input: UpdatePatientInput) {
    const patient = await prisma.patient.findUnique({ where: { userId } });

    if (!patient) {
      // Profil yo'q bo'lsa — yaratamiz
      return prisma.patient.create({
        data: { userId, ...input },
      });
    }

    return prisma.patient.update({
      where: { userId },
      data: input,
    });
  }
}
