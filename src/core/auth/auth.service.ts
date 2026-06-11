import bcrypt from 'bcryptjs';
import { prisma } from '../../infrastructure/database/prisma.client';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../common/errors/app.error';
import type { RegisterInput, VerifyOtpInput, LoginInput, AuthTokens, JwtPayload } from './auth.types';

export class AuthService {
  // ── Register ──────────────────────────────────────────────────
  async register(input: RegisterInput): Promise<{ message: string }> {
    // 1. Bu telefon raqam allaqachon bormi?
    const existing = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (existing) {
      throw new ConflictError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
    }

    // 2. Parolni hash qilamiz (ochiq saqlanmaydi)
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // 3. Userni yaratamiz
    const user = await prisma.user.create({
      data: {
        phone: input.phone,
        password: hashedPassword,
      },
    });

    // 4. OTP kod yaratamiz (6 xonali)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 daqiqa

    await prisma.otp.create({
      data: {
        userId: user.id,
        code,
        purpose: 'REGISTER',
        expiresAt,
      },
    });

    // 5. Hozircha SMS yuborish o'rniga consolega chiqaramiz
    console.log(`📱 OTP kod [${input.phone}]: ${code}`);

    return { message: 'OTP kod yuborildi' };
  }

  // ── Verify OTP ────────────────────────────────────────────────
  async verifyOtp(input: VerifyOtpInput): Promise<{ message: string }> {
    // 1. Userni topamiz
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user) {
      throw new NotFoundError('Foydalanuvchi');
    }

    // 2. OTP kodni topamiz
    const otp = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: input.code,
        purpose: 'REGISTER',
        usedAt: null, // Ishlatilmagan
      },
    });

    if (!otp) {
      throw new ValidationError('OTP kod noto\'g\'ri');
    }

    // 3. Muddati o'tganmi?
    if (otp.expiresAt < new Date()) {
      throw new ValidationError('OTP kod muddati o\'tgan');
    }

    // 4. OTP ni ishlatilgan deb belgilaymiz
    await prisma.otp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });

    // 5. Userni verified qilamiz
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    return { message: 'Telefon raqam tasdiqlandi' };
  }

  // ── Login ─────────────────────────────────────────────────────
  async login(input: LoginInput): Promise<{ user: JwtPayload }> {
    // 1. Userni topamiz
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user || !user.password) {
      throw new UnauthorizedError('Telefon yoki parol noto\'g\'ri');
    }

    // 2. Verified bo'lganmi?
    if (!user.isVerified) {
      throw new UnauthorizedError('Telefon raqam tasdiqlanmagan');
    }

    // 3. Parolni tekshiramiz
    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Telefon yoki parol noto\'g\'ri');
    }

    return {
      user: {
        userId: user.id,
        role: user.role,
      },
    };
  }
}