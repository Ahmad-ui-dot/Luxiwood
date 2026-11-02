import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators';
import { ApiError, ApiValidationError } from '../common/api-error.decorator';
import { ApiPaginatedResponse } from '../common/dto/paginated-response.dto';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { AdminProductsService } from './admin-products.service';
import {
  AdminProductQueryDto,
  CreateProductDto,
  CreateProductSizeDto,
  SetProductMaterialsDto,
  UpdateProductDto,
  UpdateProductSizeDto,
} from './dto/admin-product.dto';
import { AdminProductDto, AdminProductListItemDto, DeleteProductResultDto, ProductSizeDto } from './dto/product.response.dto';

const ID_PARAM = { name: 'id', description: 'ID товара', example: 1 };
const SIZE_PARAM = { name: 'sizeId', description: 'ID размера этого товара', example: 2 };

@ApiTags('Админ: товары')
@Roles('ADMIN')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: AdminProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Все товары',
    description: 'Только администратор. Вместе со скрытыми. Поиск по названию и артикулу, фильтры по категории, видимости, комнате, типу, значку. Новые — сверху.',
  })
  @ApiPaginatedResponse(AdminProductListItemDto, 'Страница списка товаров')
  @ApiValidationError('isActive — true или false')
  findAll(@Query() query: AdminProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Товар для редактирования', description: 'Только администратор. Все поля, разрешённые материалы (вместе с отключёнными) и размеры.' })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ description: 'Товар', type: AdminProductDto })
  @ApiError(400, 'ID в адресе должен быть целым числом')
  @ApiError(404, 'Товар не найден')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Создать товар',
    description:
      'Только администратор. Можно сразу передать материалы и размеры. slug и sku уникальны. ' +
      'Материал должен подходить к роли: MAIN — ткань (FABRIC) у мягкой мебели или дерево (WOOD) у корпусной, COLOR — цвет, WOOD — дерево. ' +
      'oldPrice (для скидки) должна быть больше basePrice.',
  })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      sofa: {
        summary: 'Диван с материалами и размерами',
        value: {
          slug: 'divan-tryohmestnyj',
          sku: 'LX-106',
          name: 'Диван трёхместный',
          description: 'Трёхместный диван с мягкими подушками.',
          categoryId: 1,
          basePrice: 8900,
          kind: 'FABRIC',
          room: 'LIVING',
          badge: 'NEW',
          materialsText: 'Каркас: массив сосны · Обивка: ткань на выбор',
          productionDays: 14,
          model3dKey: 'sofa',
          materials: [
            { materialId: 1, role: 'MAIN', isDefault: true },
            { materialId: 5, role: 'COLOR', isDefault: true },
            { materialId: 10, role: 'WOOD', isDefault: true },
          ],
          sizes: [{ label: '210 см', widthCm: 210, heightCm: 85, depthCm: 95, priceDelta: 0, isDefault: true }],
        },
      },
      minimal: {
        summary: 'Минимум полей (материалы и размеры — потом)',
        value: { slug: 'stol-novyy', sku: 'LX-506', name: 'Стол «Новый»', categoryId: 5, basePrice: 2500, kind: 'WOOD', room: 'DINING', widthCm: 140, productionDays: 10, model3dKey: 'table' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Товар создан', type: AdminProductDto })
  @ApiError(
    400,
    { message: 'Проверьте введённые данные', errors: ['Цена — целое число сомони'] },
    'Категория с ID 99 не найдена',
    '«Дуб» (WOOD) нельзя выбрать как цвет: здесь нужен материал типа COLOR',
    'Старая цена (oldPrice) должна быть больше текущей — иначе это не скидка',
  )
  @ApiError(409, 'Товар со slug «divan-orom» уже есть', 'Товар с артикулом «LX-101» уже есть')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Изменить товар',
    description:
      'Только администратор. Меняются только переданные поля: цена, oldPrice (null — убрать скидку), значок, видимость isActive и всё остальное. ' +
      'Материалы — через PUT /materials, размеры — через /sizes.',
  })
  @ApiParam(ID_PARAM)
  @ApiBody({
    type: UpdateProductDto,
    examples: {
      sale: { summary: 'Скидка', value: { basePrice: 7900, oldPrice: 8900, badge: 'HIT' } },
      hide: { summary: 'Скрыть из каталога', value: { isActive: false } },
    },
  })
  @ApiOkResponse({ description: 'Товар изменён', type: AdminProductDto })
  @ApiError(400, { message: 'Проверьте введённые данные', errors: ['Поле «price» не поддерживается'] }, 'Старая цена (oldPrice) должна быть больше текущей — иначе это не скидка')
  @ApiError(404, 'Товар не найден')
  @ApiError(409, 'Товар со slug «divan-orom» уже есть')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить товар',
    description:
      'Только администратор. Если товар есть в заказах, он не удаляется, а скрывается (isActive = false) — об этом говорят поля deleted и hidden. ' +
      'Иначе удаляется вместе с размерами, отзывами и отметками в избранном.',
  })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ description: 'Товар удалён или скрыт', type: DeleteProductResultDto })
  @ApiError(404, 'Товар не найден')
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Put(':id/materials')
  @ApiOperation({
    summary: 'Разрешённые материалы товара',
    description: 'Только администратор. Заменяет весь список целиком. В каждой роли (MAIN, COLOR, WOOD) не больше одного варианта по умолчанию.',
  })
  @ApiParam(ID_PARAM)
  @ApiBody({
    type: SetProductMaterialsDto,
    examples: {
      sofa: {
        summary: 'Мягкая мебель: ткани, цвета, дерево',
        value: {
          materials: [
            { materialId: 1, role: 'MAIN', isDefault: true },
            { materialId: 2, role: 'MAIN' },
            { materialId: 5, role: 'COLOR', isDefault: true },
            { materialId: 6, role: 'COLOR' },
            { materialId: 10, role: 'WOOD', isDefault: true },
          ],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Материалы сохранены, в ответе весь товар', type: AdminProductDto })
  @ApiError(
    400,
    'Материал с ID 99 не найден',
    '«Дуб» (WOOD) нельзя выбрать как цвет: здесь нужен материал типа COLOR',
    'По умолчанию можно отметить только один вариант: цвет',
  )
  @ApiError(404, 'Товар не найден')
  setMaterials(@Param('id', ParseIdPipe) id: number, @Body() dto: SetProductMaterialsDto) {
    return this.productsService.setMaterials(id, dto.materials);
  }

  @Post(':id/sizes')
  @ApiOperation({ summary: 'Добавить размер', description: 'Только администратор. Если isDefault = true, отметка «по умолчанию» снимается с остальных размеров.' })
  @ApiParam(ID_PARAM)
  @ApiBody({ type: CreateProductSizeDto, examples: { wide: { summary: 'Широкий вариант', value: { label: '260 см', widthCm: 260, heightCm: 85, depthCm: 95, priceDelta: 2200 } } } })
  @ApiCreatedResponse({ description: 'Размер добавлен', type: ProductSizeDto })
  @ApiValidationError('Ширина — от 10 до 500 см')
  @ApiError(404, 'Товар не найден')
  addSize(@Param('id', ParseIdPipe) id: number, @Body() dto: CreateProductSizeDto) {
    return this.productsService.addSize(id, dto);
  }

  @Patch(':id/sizes/:sizeId')
  @ApiOperation({ summary: 'Изменить размер', description: 'Только администратор. Меняются только переданные поля.' })
  @ApiParam(ID_PARAM)
  @ApiParam(SIZE_PARAM)
  @ApiBody({ type: UpdateProductSizeDto, examples: { price: { summary: 'Новая доплата', value: { priceDelta: 1500 } } } })
  @ApiOkResponse({ description: 'Размер изменён', type: ProductSizeDto })
  @ApiValidationError('Доплата за размер — целое число сомони')
  @ApiError(404, 'Товар не найден', 'Размер не найден у этого товара')
  updateSize(
    @Param('id', ParseIdPipe) id: number,
    @Param('sizeId', ParseIdPipe) sizeId: number,
    @Body() dto: UpdateProductSizeDto,
  ) {
    return this.productsService.updateSize(id, sizeId, dto);
  }

  @Delete(':id/sizes/:sizeId')
  @ApiOperation({ summary: 'Удалить размер', description: 'Только администратор. В старых заказах размер остаётся в снимке заказа.' })
  @ApiParam(ID_PARAM)
  @ApiParam(SIZE_PARAM)
  @ApiOkResponse({ description: 'Размер удалён — в ответе удалённая запись', type: ProductSizeDto })
  @ApiError(404, 'Размер не найден у этого товара')
  removeSize(@Param('id', ParseIdPipe) id: number, @Param('sizeId', ParseIdPipe) sizeId: number) {
    return this.productsService.removeSize(id, sizeId);
  }
}
