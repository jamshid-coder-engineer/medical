import { prisma } from '../../infrastructure/database/prisma.client';
import { NotFoundError, ValidationError, ForbiddenError } from '../../common/errors/app.error';
import type { CreateAppointmentInput, UpdateAppointmentStatusInput } from './appointment.types';

export class AppointmentService {
  async create(userId: string, input: CreateAppointmentInput) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundError('Bemor profili');

    const doctor = await prisma.doctor.findFirst({
      where: { id: input.doctorId, deletedAt: null, isAvailable: true },
    });
    if (!doctor) throw new NotFoundError('Shifokor');

    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new ValidationError('Qabul vaqti o\'tmishda bo\'lishi mumkin emas');
    }

    // Shu vaqtda shifokor band emasmi?
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: input.doctorId,
        scheduledAt,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });
    if (conflict) throw new ValidationError('Bu vaqtda shifokor band');

    return prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: input.doctorId,
        scheduledAt,
        reason: input.reason,
      },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
    });
  }

  async getMy(userId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundError('Bemor profili');

    return prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: { scheduledAt: 'desc' },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
    });
  }

  async updateStatus(userId: string, appointmentId: string, input: UpdateAppointmentStatusInput) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });
    if (!appointment) throw new NotFoundError('Qabul');

    // Faqat o'zining qabulini o'zgartira oladi
    if (appointment.patient.userId !== userId) {
      throw new ForbiddenError('Bu qabul sizga tegishli emas');
    }

    // Bekor qilish uchun faqat PENDING yoki CONFIRMED bo'lishi kerak
    if (input.status === 'CANCELLED' && appointment.status === 'COMPLETED') {
      throw new ValidationError('Tugallangan qabulni bekor qilib bo\'lmaydi');
    }

    return prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: input.status },
    });
  }
}
