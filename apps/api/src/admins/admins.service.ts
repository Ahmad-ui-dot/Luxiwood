import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto, UpdateAdminDto } from './admins.dto';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }, orderBy: { id: 'asc' } });
    return admins.map(toAdmin);
  }

  async create(dto: CreateAdminDto) {
    const email = dto.email?.toLowerCase() || null;
    await this.checkFree(dto.name, email);
    const admin = await this.prisma.user.create({
      data: { name: dto.name, email, role: 'ADMIN', passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    return toAdmin(admin);
  }

  async update(id: number, dto: UpdateAdminDto) {
    await this.findAdmin(id);
    const email = dto.email?.toLowerCase();
    await this.checkFree(dto.name, email, id);

    const data: Prisma.UserUpdateInput = { name: dto.name, email };
    if (dto.password) {
      // Токены, выданные до смены пароля, перестают действовать (см. AuthGuard)
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      data.passwordChangedAt = new Date();
    }
    return toAdmin(await this.prisma.user.update({ where: { id }, data }));
  }

  // Себя удалить нельзя, и в админке всегда остаётся хотя бы один администратор
  async remove(id: number, currentUserId: number) {
    const admin = await this.findAdmin(id);
    if (id === currentUserId) {
      throw new BadRequestException('Нельзя удалить самого себя — войдите под другим администратором');
    }
    if ((await this.prisma.user.count({ where: { role: 'ADMIN' } })) <= 1) {
      throw new ConflictException('Нельзя удалить последнего администратора');
    }
    await this.prisma.user.delete({ where: { id } });
    return toAdmin(admin);
  }

  private async findAdmin(id: number) {
    const admin = await this.prisma.user.findFirst({ where: { id, role: 'ADMIN' } });
    if (!admin) {
      throw new NotFoundException('Администратор не найден');
    }
    return admin;
  }

  // Имя и email уникальны среди всех пользователей — по ним входят
  private async checkFree(name: string | undefined, email: string | null | undefined, exceptId?: number) {
    const conditions: Prisma.UserWhereInput[] = [];
    if (name) conditions.push({ name: { equals: name, mode: 'insensitive' } });
    if (email) conditions.push({ email });
    if (conditions.length === 0) return;

    const taken = await this.prisma.user.findFirst({ where: { id: exceptId ? { not: exceptId } : undefined, OR: conditions } });
    if (taken) {
      throw new ConflictException(
        name && taken.name.toLowerCase() === name.toLowerCase() ? `Имя «${name}» уже занято` : 'Пользователь с таким email уже есть',
      );
    }
  }
}

function toAdmin(user: User) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}
