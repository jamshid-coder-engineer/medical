export interface CreateRecordInput {
  patientId: string;
  appointmentId?: string;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  attachments?: string[];
}
