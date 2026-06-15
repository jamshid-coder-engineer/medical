export interface CreateAppointmentInput {
  doctorId: string;
  scheduledAt: string;
  reason?: string;
}

export interface UpdateAppointmentStatusInput {
  status: 'CANCELLED' | 'CONFIRMED' | 'COMPLETED';
}
