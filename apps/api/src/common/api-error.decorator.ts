import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from './dto/error-response.dto';

type ErrorExample = string | { message: string; errors: string[] };

// Описание ошибки в Swagger: статус, схема ErrorResponseDto и один или несколько примеров ответа.
// Пример: @ApiError(404, 'Товар не найден')
//         @ApiError(400, { message: 'Проверьте введённые данные', errors: ['Количество — от 1 до 99'] }, 'Материал недоступен для этого товара')
export function ApiError(status: number, ...examples: ErrorExample[]) {
  const bodies = examples.map((example) =>
    typeof example === 'string' ? { statusCode: status, message: example } : { statusCode: status, ...example },
  );
  const description = STATUS_DESCRIPTIONS[status] ?? 'Ошибка';

  if (bodies.length === 1) {
    return applyDecorators(ApiResponse({ status, description, type: ErrorResponseDto, example: bodies[0] }));
  }
  const named = Object.fromEntries(bodies.map((body, index) => [`example${index + 1}`, { summary: body.message, value: body }]));
  return applyDecorators(ApiResponse({ status, description, type: ErrorResponseDto, examples: named }));
}

// Ошибка валидации полей — общий текст и список ошибок по полям
export function ApiValidationError(...errors: string[]) {
  return ApiError(400, { message: 'Проверьте введённые данные', errors });
}

const STATUS_DESCRIPTIONS: Record<number, string> = {
  400: 'Ошибка в данных запроса',
  401: 'Нет токена или он недействителен',
  403: 'Недостаточно прав',
  404: 'Не найдено',
  409: 'Конфликт с текущими данными',
  413: 'Файл слишком большой',
  429: 'Слишком много запросов',
};
