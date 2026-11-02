import { PASSWORD_MIN_LENGTH } from '@luxiwood/shared';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { NAME_ERROR, NAME_PATTERN } from '../auth/dto/auth.dto';
import { Trim } from '../common/query-transforms';

export class CreateAdminDto {
  @ApiProperty({ description: 'Имя — логин для входа в админку. Уникальное без учёта регистра', minLength: 2, maxLength: 50, example: 'Менеджер' })
  @Trim()
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя — от 2 до 50 символов' })
  @MaxLength(50, { message: 'Имя — от 2 до 50 символов' })
  @Matches(NAME_PATTERN, { message: NAME_ERROR })
  name: string;

  @ApiPropertyOptional({ description: 'Email — по нему тоже можно входить. Уникальный', format: 'email', maxLength: 200, example: 'manager@luxiwood.tj' })
  @IsOptional()
  @Trim()
  @IsEmail({}, { message: 'Неверный формат email. Пример: manager@luxiwood.tj' })
  @MaxLength(200, { message: 'Email — не длиннее 200 символов' })
  email?: string;

  @ApiProperty({ description: 'Пароль', minLength: PASSWORD_MIN_LENGTH, maxLength: 100, example: 'manager123' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: `Пароль — не короче ${PASSWORD_MIN_LENGTH} символов` })
  @MaxLength(100, { message: 'Пароль — не длиннее 100 символов' })
  password: string;
}

// Меняются только переданные поля. Новый пароль завершает старые входы этого администратора
export class UpdateAdminDto extends PartialType(CreateAdminDto) {}

export class AdminUserDto {
  @ApiProperty({ description: 'ID администратора', type: 'integer', example: 1 })
  id: number;

  @ApiProperty({ description: 'Имя — логин для входа', example: 'Администратор' })
  name: string;

  @ApiProperty({ description: 'Email для входа', type: String, nullable: true, example: 'admin@luxiwood.tj' })
  email: string | null;

  @ApiProperty({ description: 'Когда создан', type: String, format: 'date-time', example: '2026-10-01T10:00:00.000Z' })
  createdAt: string;
}
