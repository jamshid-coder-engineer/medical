import bcrypt from 'bcryptjs';
import { prisma } from '../../infrastructure/database/prisma.client';
import { redis } from '../../infrastructure/cache/redis.client';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../common/errors/app.error';
import type { RegisterInput, VerifyOtpInput, LoginInput, JwtPayload } from './auth.types';

const OTP_TTL = 5 * 60; // 5 daqiqa (soniyada)

function otpKey(phone: string) {
  return `otp:${phone}`;
}

export class AuthService {
  async register(input: RegisterInput): Promise<{ message: string }> {
    const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existing) {
      throw new ConflictError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    await prisma.user.create({
      data: { phone: input.phone, password: hashedPassword },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP ni Redisga saqlaymiz (5 daqiqa)
    await redis.set(otpKey(input.phone), code, 'EX', OTP_TTL);

    console.log(`📱 OTP kod [${input.phone}]: ${code}`);

    return { message: 'OTP kod yuborildi' };
  }

  async verifyOtp(input: VerifyOtpInput): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (!user) throw new NotFoundError('Foydalanuvchi');

    const savedCode = await redis.get(otpKey(input.phone));

    if (!savedCode) {
      throw new ValidationError('OTP kod muddati o\'tgan yoki yuborilmagan');
    }

    if (savedCode !== input.code) {
      throw new ValidationError('OTP kod noto\'g\'ri');
    }

    // OTP ni o'chiramiz — bir marta ishlatiladi
    await redis.del(otpKey(input.phone));

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    return { message: 'Telefon raqam tasdiqlandi' };
  }

  async login(input: LoginInput): Promise<{ user: JwtPayload }> {
    const user = await prisma.user.findUnique({ where: { phone: input.phone } });

    if (!user || !user.password) {
      throw new UnauthorizedError('Telefon yoki parol noto\'g\'ri');
    }

    if (!user.isVerified) {
      throw new UnauthorizedError('Telefon raqam tasdiqlanmagan');
    }

    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Telefon yoki parol noto\'g\'ri');
    }

    return { user: { userId: user.id, role: user.role } };
  }
}
