import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category.response.dto';

@ApiTags('Категории')
@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('categories')
  @ApiOperation({
    summary: 'Список категорий',
    description:
      'Доступно всем, без входа. Возвращает все категории в порядке sortOrder (его задаёт администратор), ' +
      'при равном sortOrder — по ID. slug категории передаётся в фильтр GET /api/products?category=.',
  })
  @ApiOkResponse({
    description: 'Категории. Пустой массив — если категорий ещё нет',
    type: [CategoryResponseDto],
    example: [
      { id: 1, slug: 'divany', name: 'Диваны', sortOrder: 1 },
      { id: 2, slug: 'kresla', name: 'Кресла', sortOrder: 2 },
      { id: 3, slug: 'krovati', name: 'Кровати', sortOrder: 3 },
    ],
  })
  findAll() {
    return this.categoriesService.findAll();
  }
}
