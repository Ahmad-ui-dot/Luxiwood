import type { Role } from '@luxiwood/shared';
import { applyDecorators, createParamDecorator, ExecutionContext, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiError } from '../common/api-error.decorator';
import { AuthGuard, AuthRequest, AuthUser, OPTIONAL_AUTH_KEY, ROLES_KEY } from './auth.guard';

// Имя схемы авторизации в Swagger (кнопка Authorize)
export const BEARER = 'jwt';

const UNAUTHORIZED = [
  'Нужно войти: передайте токен в заголовке Authorization: Bearer <токен>',
  'Токен недействителен или устарел — войдите заново',
  'Пароль был изменён — войдите заново',
];

// Нужен вход (любая роль)
export function Auth() {
  return applyDecorators(UseGuards(AuthGuard), ApiBearerAuth(BEARER), ApiError(401, ...UNAUTHORIZED));
}

// Нужен вход с одной из ролей: @Roles('ADMIN')
export function Roles(...roles: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    Auth(),
    ApiError(403, 'Недостаточно прав для этого действия'),
  );
}

// Вход не обязателен, но если токен передан — он проверяется и пользователь известен
export function OptionalAuth() {
  return applyDecorators(
    SetMetadata(OPTIONAL_AUTH_KEY, true),
    UseGuards(AuthGuard),
    ApiBearerAuth(BEARER),
    ApiError(401, UNAUTHORIZED[1]),
  );
}

// Текущий пользователь в методе контроллера: me(@CurrentUser() user: AuthUser)
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined => context.switchToHttp().getRequest<AuthRequest>().user,
);
