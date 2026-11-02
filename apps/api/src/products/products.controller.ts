import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiError } from '../common/api-error.decorator';
import { ApiPaginatedResponse } from '../common/dto/paginated-response.dto';
import { ProductDetailsDto, ProductFiltersDto, ProductListItemDto } from './dto/product.response.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductsService } from './products.service';

@ApiTags('Товары')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Каталог товаров',
    description:
      'Доступно всем, без входа. Только активные товары, по страницам. Все фильтры необязательные и сочетаются:\n\n' +
      '- **category** — slug категории; **room** — комната; **type** — тип мебели;\n' +
      '- **search** — часть названия или артикула;\n' +
      '- **minPrice / maxPrice** — цена в сомони, включительно;\n' +
      '- **maxWidth** — «встанет в нишу»: ширина товара не больше, см;\n' +
      '- **color** — ID цвета или дерева из GET /api/products/filters;\n' +
      '- **maxDays** — срок изготовления не больше, дней;\n' +
      '- **badge** — HIT или NEW; **sale=true** — только со скидкой;\n' +
      '- **sort** — popular (по умолчанию), price_asc, price_desc, rating, new;\n' +
      '- **page / limit** — страница (с 1) и размер страницы (1–100, по умолчанию 20).\n\n' +
      'Неизвестный slug категории даёт пустой список. Неверное значение или лишний параметр — 400 со списком errors.',
  })
  @ApiPaginatedResponse(ProductListItemDto, 'Страница каталога')
  @ApiError(
    400,
    { message: 'Проверьте введённые данные', errors: ['Сортировка: popular, price_asc, price_desc, rating или new'] },
    { message: 'Проверьте введённые данные', errors: ['Количество на странице — от 1 до 100'] },
    { message: 'Проверьте введённые данные', errors: ['Поле «colour» не поддерживается'] },
  )
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('filters')
  @ApiOperation({
    summary: 'Данные для фильтров каталога',
    description:
      'Доступно всем, без входа. По активным товарам: диапазоны цены, ширины и срока, список цветов обивки и пород дерева, ' +
      'комнат и типов мебели — у каждого сколько товаров. Значения передаются в GET /api/products.',
  })
  @ApiOkResponse({ description: 'Фильтры', type: ProductFiltersDto })
  filters() {
    return this.productsService.filters();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Страница товара',
    description:
      'Доступно всем, без входа. Товар с вариантами: основные материалы (mainMaterials), цвета обивки (colorMaterials), ' +
      'дерево (woodMaterials), размеры (sizes) и варианты по умолчанию (defaults). Только активные материалы. ' +
      'Скрытый товар отдаёт 404, как и несуществующий.',
  })
  @ApiParam({ name: 'slug', description: 'slug товара из каталога', example: 'divan-orom' })
  @ApiOkResponse({ description: 'Товар', type: ProductDetailsDto })
  @ApiError(404, 'Товар не найден')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
