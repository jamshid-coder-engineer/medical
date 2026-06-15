export interface CreateDoctorInput {
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  bio?: string;
}
