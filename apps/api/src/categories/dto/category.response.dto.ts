import type { Category } from '@luxiwood/shared';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto implements Category {
  @ApiProperty({ description: 'ID категории', type: 'integer', example: 1 })
  id: number;

  @ApiProperty({ description: 'Адрес категории в URL (латиница)', example: 'divany' })
  slug: string;

  @ApiProperty({ description: 'Название', example: 'Диваны' })
  name: string;

  @ApiProperty({ description: 'Порядок в меню: меньше — выше', type: 'integer', example: 1 })
  sortOrder: number;
}

export class AdminCategoryDto extends CategoryResponseDto {
  @ApiProperty({ description: 'Сколько товаров в категории (вместе со скрытыми)', type: 'integer', example: 5 })
  productsCount: number;
}
