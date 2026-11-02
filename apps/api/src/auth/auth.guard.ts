import type { Role } from '@luxiwood/shared';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export const ROLES_KEY = 'roles';
export const OPTIONAL_AUTH_KEY = 'optionalAuth';

// Кто сделал запрос. Кладётся в request.user после проверки токена
export interface AuthUser {
  id: number;
  role: Role;
}

export interface JwtPayload {
  sub: number;
  role: Role;
  iat?: number; // когда выдан, секунды — добавляет библиотека JWT
}

export type AuthRequest = Request & { user?: AuthUser };

// Проверяет токен из заголовка Authorization: Bearer <token> и роль из @Roles(...).
// Роль берётся из базы, а токен, выданный до смены пароля, не принимается
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const targets = [context.getHandler(), context.getClass()];
    const optional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, targets);
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets) ?? [];

    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      if (optional) {
        return true;
      }
      throw new UnauthorizedException('Нужно войти: передайте токен в заголовке Authorization: Bearer <токен>');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Токен недействителен или устарел — войдите заново');
    }

    // Пользователь должен существовать, а токен — быть выдан после последней смены пароля
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { role: true, passwordChangedAt: true } });
    if (!user) {
      throw new UnauthorizedException('Токен недействителен или устарел — войдите заново');
    }
    if (user.passwordChangedAt && (payload.iat ?? 0) < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      throw new UnauthorizedException('Пароль был изменён — войдите заново');
    }
    request.user = { id: payload.sub, role: user.role };

    if (roles.length > 0 && !roles.includes(request.user.role)) {
      throw new ForbiddenException('Недостаточно прав для этого действия');
    }
    return true;
  }
}
