import type { Paginated } from '@luxiwood/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// ?page=1&limit=20 — одинаково во всех списках
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Номер страницы, с 1', type: 'integer', minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Номер страницы должен быть целым числом' })
  @Min(1, { message: 'Номер страницы начинается с 1' })
  page: number = 1;

  @ApiPropertyOptional({ description: 'Записей на странице', type: 'integer', minimum: 1, maximum: 100, default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Количество на странице должно быть целым числом' })
  @Min(1, { message: 'Количество на странице — от 1 до 100' })
  @Max(100, { message: 'Количество на странице — от 1 до 100' })
  limit: number = 20;
}

// Параметры skip/take для Prisma
export function pageArgs(query: PaginationQueryDto) {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}

export function paginate<T>(items: T[], total: number, query: PaginationQueryDto): Paginated<T> {
  return { items, total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) };
}
