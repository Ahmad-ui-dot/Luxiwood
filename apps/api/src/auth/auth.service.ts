import { randomInt } from 'node:crypto';
import { normalizePhone } from '@luxiwood/shared';
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './auth.guard';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateMeDto } from './dto/auth.dto';

// Код восстановления пароля: сколько минут действует и сколько неверных попыток разрешено
const RESET_CODE_MINUTES = 15;
const RESET_CODE_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const phone = dto.phone ? normalizePhone(dto.phone) : null;
    const email = dto.email.toLowerCase();
    await this.checkFree({ name: dto.name, phone, email });

    const user = await this.prisma.user.create({
      data: { name: dto.name, phone, email, role: 'CLIENT', passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    return this.tokenFor(user);
  }

  // Логин — email (если есть «@») или имя без учёта регистра. Телефон для входа не используется
  async login(dto: LoginDto) {
    const where: Prisma.UserWhereInput = dto.login.includes('@')
      ? { email: dto.login.toLowerCase() }
      : { name: { equals: dto.login, mode: 'insensitive' } };
    const user = await this.prisma.user.findFirst({ where });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    return this.tokenFor(user);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден — войдите заново');
    }
    return toUserResponse(user);
  }

  async updateMe(userId: number, dto: UpdateMeDto) {
    const phone = dto.phone ? normalizePhone(dto.phone) : undefined;
    const email = dto.email?.toLowerCase();
    await this.checkFree({ name: dto.name, phone, email }, userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, email, phone, defaultAddress: dto.defaultAddress },
    });
    return toUserResponse(user);
  }

  // Смена пароля со входом. Старые токены перестают действовать, в ответе — новый
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден — войдите заново');
    }
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Текущий пароль введён неверно');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Новый пароль должен отличаться от текущего');
    }
    return this.tokenFor(await this.setPassword(userId, dto.newPassword));
  }

  // Отправляет на email код восстановления. Ответ одинаковый, есть такой email или нет, —
  // чтобы по нему нельзя было узнать, кто зарегистрирован
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email.toLowerCase() } });
    if (user?.email) {
      const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
      await this.prisma.$transaction([
        this.prisma.passwordReset.deleteMany({ where: { userId: user.id } }),
        this.prisma.passwordReset.create({
          data: { userId: user.id, codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + RESET_CODE_MINUTES * 60_000) },
        }),
      ]);
      await this.mail.send({
        to: user.email,
        subject: 'Код для восстановления пароля — Luxiwood',
        text:
          `Здравствуйте, ${user.name}!\n\n` +
          `Код для восстановления пароля на сайте Luxiwood: ${code}\n\n` +
          `Код действует ${RESET_CODE_MINUTES} минут. Если вы не просили восстановить пароль, просто не обращайте внимания на это письмо.`,
      });
    }
    return { message: `Если этот email зарегистрирован, мы отправили на него код. Код действует ${RESET_CODE_MINUTES} минут` };
  }

  // Новый пароль по коду из письма. Код одноразовый, 5 неверных попыток — и нужен новый код
  async resetPassword(dto: ResetPasswordDto) {
    const invalid = new BadRequestException('Код неверный или устарел. Запросите новый код');
    const user = await this.prisma.user.findFirst({ where: { email: dto.email.toLowerCase() } });
    const reset = user && (await this.prisma.passwordReset.findFirst({ where: { userId: user.id }, orderBy: { id: 'desc' } }));
    if (!user || !reset || reset.expiresAt < new Date() || reset.attempts >= RESET_CODE_ATTEMPTS) {
      throw invalid;
    }
    if (!(await bcrypt.compare(dto.code, reset.codeHash))) {
      await this.prisma.passwordReset.update({ where: { id: reset.id }, data: { attempts: { increment: 1 } } });
      throw invalid;
    }
    await this.prisma.passwordReset.deleteMany({ where: { userId: user.id } });
    return this.tokenFor(await this.setPassword(user.id, dto.newPassword));
  }

  private async setPassword(userId: number, password: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(password, 10), passwordChangedAt: new Date() },
    });
  }

  // Имя, телефон и email у разных пользователей не повторяются. Имя сравнивается без учёта регистра
  private async checkFree(fields: { name?: string; phone?: string | null; email?: string | null }, exceptUserId?: number) {
    const { name, phone, email } = fields;
    const conditions: Prisma.UserWhereInput[] = [];
    if (name) {
      conditions.push({ name: { equals: name, mode: 'insensitive' } });
    }
    if (phone) {
      conditions.push({ phone });
    }
    if (email) {
      conditions.push({ email });
    }
    if (conditions.length === 0) {
      return;
    }

    const taken = await this.prisma.user.findFirst({
      where: { id: exceptUserId ? { not: exceptUserId } : undefined, OR: conditions },
    });
    if (!taken) {
      return;
    }
    if (name && taken.name.toLowerCase() === name.toLowerCase()) {
      throw new ConflictException(`Имя «${name}» уже занято — выберите другое, например «${name} К.»`);
    }
    throw new ConflictException(
      phone && taken.phone === phone
        ? 'Пользователь с таким телефоном уже зарегистрирован'
        : 'Пользователь с таким email уже зарегистрирован',
    );
  }

  private async tokenFor(user: User) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return { accessToken: await this.jwt.signAsync(payload), user: toUserResponse(user) };
  }
}

// Пользователь без хеша пароля и служебных полей
export function toUserResponse(user: User) {
  const { passwordHash, passwordChangedAt, ...rest } = user;
  return rest;
}
