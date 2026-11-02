import type { Paginated } from '@luxiwood/shared';
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiHideProperty, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';

// Страница списка. Тип элементов в items подставляет декоратор ApiPaginatedResponse
export class PaginatedResponseDto<T> implements Paginated<T> {
  @ApiHideProperty()
  items: T[];

  @ApiProperty({ description: 'Сколько всего записей подходит под фильтры', type: 'integer', example: 5 })
  total: number;

  @ApiProperty({ description: 'Номер текущей страницы (с 1)', type: 'integer', example: 1 })
  page: number;

  @ApiProperty({ description: 'Сколько записей на странице', type: 'integer', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Сколько всего страниц. 0 — если ничего не найдено', type: 'integer', example: 1 })
  pages: number;
}

// Ответ 200 со страницей списка: в Swagger видно, какие объекты лежат в items
export function ApiPaginatedResponse(model: Type<unknown>, description: string) {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            type: 'object',
            required: ['items'],
            properties: {
              items: { type: 'array', description: 'Записи текущей страницы', items: { $ref: getSchemaPath(model) } },
            },
          },
        ],
      },
    }),
  );
}
