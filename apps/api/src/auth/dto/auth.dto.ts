import { PASSWORD_MIN_LENGTH, PHONE_ERROR } from '@luxiwood/shared';
import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/query-transforms';

// Телефон: +992 и 9 цифр, пробелы допускаются (то же правило, что normalizePhone в packages/shared)
export const PHONE_PATTERN = /^\s*\+992(\s*\d){9}\s*$/;

// Имя — это логин: хотя бы одна буква и без «@», чтобы при входе его нельзя было спутать с телефоном или email
export const NAME_PATTERN = /^(?=.*\p{L})[^@]+$/u;
export const NAME_ERROR = 'Имя должно содержать буквы и не может содержать @';

export class RegisterDto {
  @ApiProperty({
    description: 'Имя — оно же логин для входа. Уникальное без учёта регистра: «Мадина» и «мадина» — одно имя',
    minLength: 2,
    maxLength: 50,
    pattern: NAME_PATTERN.source,
    example: 'Зарина',
  })
  @Trim()
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя — от 2 до 50 символов' })
  @MaxLength(50, { message: 'Имя — от 2 до 50 символов' })
  @Matches(NAME_PATTERN, { message: NAME_ERROR })
  name: string;

  @ApiProperty({ description: 'Email (например, Gmail) — по нему тоже можно входить. Уникальный', format: 'email', maxLength: 200, example: 'zarina@gmail.com' })
  @Trim()
  @IsEmail({}, { message: 'Неверный формат email. Пример: zarina@gmail.com' })
  @MaxLength(200, { message: 'Email — не длиннее 200 символов' })
  email: string;

  @ApiPropertyOptional({
    description: 'Телефон для связи по заказам: +992 и 9 цифр, пробелы допускаются. Для входа не используется',
    pattern: PHONE_PATTERN.source,
    example: '+992 93 000 00 05',
  })
  @IsOptional()
  @Matches(PHONE_PATTERN, { message: PHONE_ERROR })
  phone?: string;

  @ApiProperty({ description: 'Пароль', minLength: PASSWORD_MIN_LENGTH, maxLength: 100, example: 'madina12345' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: `Пароль — не короче ${PASSWORD_MIN_LENGTH} символов` })
  @MaxLength(100, { message: 'Пароль — не длиннее 100 символов' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Имя пользователя или email (Gmail). Телефон для входа не подходит', maxLength: 200, example: 'Администратор' })
  @Trim()
  @IsString({ message: 'Укажите имя или email' })
  @MinLength(2, { message: 'Укажите имя или email' })
  @MaxLength(200, { message: 'Логин — не длиннее 200 символов' })
  login: string;

  @ApiProperty({ description: 'Пароль', maxLength: 100, example: 'change-me' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(1, { message: 'Введите пароль' })
  @MaxLength(100, { message: 'Пароль — не длиннее 100 символов' })
  password: string;
}

export class UpdateMeDto {
  @ApiPropertyOptional({ description: 'Новое имя — оно же логин. Должно быть свободно', minLength: 2, maxLength: 50, pattern: NAME_PATTERN.source, example: 'Мадина К.' })
  @IsOptional()
  @Trim()
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя — от 2 до 50 символов' })
  @MaxLength(50, { message: 'Имя — от 2 до 50 символов' })
  @Matches(NAME_PATTERN, { message: NAME_ERROR })
  name?: string;

  @ApiPropertyOptional({ description: 'Новый email — на него приходят коды для смены пароля. Должен быть свободен', format: 'email', maxLength: 200, example: 'madina.k@gmail.com' })
  @IsOptional()
  @Trim()
  @IsEmail({}, { message: 'Неверный формат email. Пример: zarina@gmail.com' })
  @MaxLength(200, { message: 'Email — не длиннее 200 символов' })
  email?: string;

  @ApiPropertyOptional({ description: 'Телефон: +992 и 9 цифр', pattern: PHONE_PATTERN.source, example: '+992 93 000 00 02' })
  @IsOptional()
  @Matches(PHONE_PATTERN, { message: PHONE_ERROR })
  phone?: string;

  @ApiPropertyOptional({ description: 'Адрес доставки по умолчанию — подставляется при оформлении заказа', maxLength: 300, example: 'Душанбе, ул. Рудаки, 10' })
  @IsOptional()
  @Trim()
  @IsString({ message: 'Адрес должен быть строкой' })
  @MaxLength(300, { message: 'Адрес — не длиннее 300 символов' })
  defaultAddress?: string;
}

// Новый пароль — те же правила, что при регистрации
function NewPassword() {
  return applyDecorators(
    ApiProperty({ description: 'Новый пароль', minLength: PASSWORD_MIN_LENGTH, maxLength: 100, example: 'newPassword123' }),
    IsString({ message: 'Пароль должен быть строкой' }),
    MinLength(PASSWORD_MIN_LENGTH, { message: `Новый пароль — не короче ${PASSWORD_MIN_LENGTH} символов` }),
    MaxLength(100, { message: 'Новый пароль — не длиннее 100 символов' }),
  );
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Текущий пароль', maxLength: 100, example: 'client12345' })
  @IsString({ message: 'Введите текущий пароль' })
  @MinLength(1, { message: 'Введите текущий пароль' })
  @MaxLength(100, { message: 'Пароль — не длиннее 100 символов' })
  currentPassword: string;

  @NewPassword()
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email, указанный при регистрации — на него придёт код', format: 'email', example: 'madina@gmail.com' })
  @Trim()
  @IsEmail({}, { message: 'Неверный формат email. Пример: zarina@gmail.com' })
  @MaxLength(200, { message: 'Email — не длиннее 200 символов' })
  email: string;
}

export class ResetPasswordDto extends ForgotPasswordDto {
  @ApiProperty({ description: 'Код из письма — 6 цифр', pattern: '^\\d{6}$', example: '483920' })
  @Trim()
  @Matches(/^\d{6}$/, { message: 'Код — 6 цифр из письма' })
  code: string;

  @NewPassword()
  newPassword: string;
}
