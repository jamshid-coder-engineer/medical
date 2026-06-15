import { prisma } from '../../infrastructure/database/prisma.client';
import { NotFoundError, ForbiddenError } from '../../common/errors/app.error';
import type { CreateRecordInput } from './record.types';

export class RecordService {
  async getMy(userId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundError('Bemor profili');

    return prisma.medicalRecord.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
        appointment: { select: { scheduledAt: true } },
      },
    });
  }

  async create(userId: string, input: CreateRecordInput) {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) throw new ForbiddenError('Faqat shifokorlar tibbiy yozuv yarata oladi');

    const patient = await prisma.patient.findUnique({ where: { id: input.patientId } });
    if (!patient) throw new NotFoundError('Bemor');

    return prisma.medicalRecord.create({
      data: {
        patientId: input.patientId,
        doctorId: doctor.id,
        appointmentId: input.appointmentId ?? null,
        diagnosis: input.diagnosis,
        prescription: input.prescription,
        notes: input.notes,
        attachments: input.attachments ?? [],
      },
    });
  }
}
