import type { ApiError } from '@luxiwood/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Формат любой ошибки API (его отдаёт AllExceptionsFilter)
export class ErrorResponseDto implements ApiError {
  @ApiProperty({ description: 'HTTP-код ошибки', type: 'integer', example: 400 })
  statusCode: number;

  @ApiProperty({ description: 'Понятное сообщение на русском', example: 'Проверьте введённые данные' })
  message: string;

  @ApiPropertyOptional({
    description: 'Ошибки по отдельным полям. Есть только у ошибки валидации (400)',
    type: [String],
    example: ['Номер страницы начинается с 1'],
  })
  errors?: string[];
}
