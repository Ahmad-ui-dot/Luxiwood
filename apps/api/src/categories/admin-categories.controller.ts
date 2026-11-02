import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators';
import { ApiError, ApiValidationError } from '../common/api-error.decorator';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AdminCategoryDto, CategoryResponseDto } from './dto/category.response.dto';

@ApiTags('Админ: категории')
@Roles('ADMIN')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Все категории', description: 'Только администратор. Категории по порядку sortOrder и число товаров в каждой.' })
  @ApiOkResponse({ description: 'Категории', type: [AdminCategoryDto] })
  findAll() {
    return this.categoriesService.findAllForAdmin();
  }

  @Post()
  @ApiOperation({ summary: 'Создать категорию', description: 'Только администратор. slug должен быть уникальным.' })
  @ApiBody({ type: CreateCategoryDto, examples: { komody: { summary: 'Комоды', value: { slug: 'komody', name: 'Комоды', sortOrder: 7 } } } })
  @ApiCreatedResponse({ description: 'Категория создана', type: CategoryResponseDto })
  @ApiValidationError('slug: только латиница в нижнем регистре, цифры и дефисы, например komody')
  @ApiError(409, 'Категория со slug «komody» уже есть')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить категорию', description: 'Только администратор. Меняются только переданные поля.' })
  @ApiParam({ name: 'id', description: 'ID категории', example: 1 })
  @ApiBody({ type: UpdateCategoryDto, examples: { rename: { summary: 'Переименовать и поднять выше', value: { name: 'Диваны и софы', sortOrder: 0 } } } })
  @ApiOkResponse({ description: 'Категория изменена', type: CategoryResponseDto })
  @ApiValidationError('Порядок — от 0 до 1000')
  @ApiError(404, 'Категория не найдена')
  @ApiError(409, 'Категория со slug «divany» уже есть')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить категорию',
    description: 'Только администратор. Категорию с товарами (даже скрытыми) удалить нельзя — сначала перенесите или удалите товары.',
  })
  @ApiParam({ name: 'id', description: 'ID категории', example: 7 })
  @ApiOkResponse({ description: 'Категория удалена — в ответе удалённая запись', type: CategoryResponseDto })
  @ApiError(404, 'Категория не найдена')
  @ApiError(409, 'Нельзя удалить категорию: в ней товаров — 5. Сначала перенесите их в другую категорию или удалите')
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
