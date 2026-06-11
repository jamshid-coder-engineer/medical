export interface RegisterInput {
  phone: string;
  password: string;
}

export interface VerifyOtpInput {
  phone: string;
  code: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface JwtPayload {
  userId: string;
  role: string;
}