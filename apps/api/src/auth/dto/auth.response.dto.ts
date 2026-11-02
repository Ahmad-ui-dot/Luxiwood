import { AuthToken, Role, User } from '@luxiwood/shared';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto implements User {
  @ApiProperty({ description: 'ID пользователя', type: 'integer', example: 2 })
  id: number;

  @ApiProperty({ description: 'Имя', example: 'Мадина' })
  name: string;

  @ApiProperty({ description: 'Email', type: String, nullable: true, example: 'client@luxiwood.tj' })
  email: string | null;

  @ApiProperty({ description: 'Телефон без пробелов', type: String, nullable: true, example: '+992930000001' })
  phone: string | null;

  @ApiProperty({ description: 'Роль: ADMIN — администратор, CLIENT — покупатель', enum: Role, enumName: 'Role', example: 'CLIENT' })
  role: Role;

  @ApiProperty({ description: 'Адрес доставки по умолчанию', type: String, nullable: true, example: 'Душанбе, ул. Рудаки, 10' })
  defaultAddress: string | null;

  @ApiProperty({ description: 'Дата регистрации', type: String, format: 'date-time', example: '2026-10-30T09:00:00.000Z' })
  createdAt: string;
}

export class AuthTokenDto implements AuthToken {
  @ApiProperty({
    description: 'JWT-токен на 7 дней. Передаётся в заголовке Authorization: Bearer <токен> (в Swagger — кнопка Authorize)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJBRE1JTiJ9.signature',
  })
  accessToken: string;

  @ApiProperty({ description: 'Кто вошёл', type: UserResponseDto })
  user: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Что произошло, по-русски',
    example: 'Если этот email зарегистрирован, мы отправили на него код. Код действует 15 минут',
  })
  message: string;
}
