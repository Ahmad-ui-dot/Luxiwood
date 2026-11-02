import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators';
import { ApiError, ApiValidationError } from '../common/api-error.decorator';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { MaterialQueryDto } from './dto/material-query.dto';
import { AdminMaterialDto, MaterialResponseDto } from './dto/material.response.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Админ: материалы')
@Roles('ADMIN')
@Controller('admin/materials')
export class AdminMaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({
    summary: 'Все материалы',
    description: 'Только администратор. Вместе с отключёнными (isActive = false) и числом товаров, где материал разрешён. Можно отфильтровать по типу.',
  })
  @ApiOkResponse({ description: 'Материалы', type: [AdminMaterialDto] })
  @ApiValidationError('Тип материала: FABRIC, COLOR, WOOD или FINISH')
  findAll(@Query() query: MaterialQueryDto) {
    return this.materialsService.findAllForAdmin(query);
  }

  @Post()
  @ApiOperation({ summary: 'Добавить материал', description: 'Только администратор. Новый материал сразу виден покупателям, если isActive не false.' })
  @ApiBody({
    type: CreateMaterialDto,
    examples: {
      fabric: { summary: 'Ткань', value: { type: 'FABRIC', name: 'Микровелюр', hex: '#9C8B7A', priceDelta: 300 } },
      wood: { summary: 'Порода дерева', value: { type: 'WOOD', name: 'Вишня', hex: '#8B4A2B', priceDelta: 500 } },
    },
  })
  @ApiCreatedResponse({ description: 'Материал создан', type: MaterialResponseDto })
  @ApiValidationError('Цвет — в формате #RRGGBB, например #EDE6DA', 'Тип материала: FABRIC, COLOR, WOOD или FINISH')
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Изменить или отключить материал',
    description:
      'Только администратор. Меняются только переданные поля. isActive = false отключает материал: покупатели его не видят, ' +
      'в новых заказах он не принимается, старые заказы не меняются. Тип нельзя сменить, если материал уже привязан к товарам.',
  })
  @ApiParam({ name: 'id', description: 'ID материала', example: 2 })
  @ApiBody({
    type: UpdateMaterialDto,
    examples: {
      price: { summary: 'Новая доплата', value: { priceDelta: 450 } },
      disable: { summary: 'Отключить', value: { isActive: false } },
    },
  })
  @ApiOkResponse({ description: 'Материал изменён', type: MaterialResponseDto })
  @ApiValidationError('Доплата должна быть целым числом сомони')
  @ApiError(404, 'Материал не найден')
  @ApiError(409, 'Нельзя сменить тип: материал уже привязан к товарам')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить материал',
    description: 'Только администратор. Удаляется только неиспользуемый материал. Если он есть в товарах или заказах — 409: отключите его через PATCH { isActive: false }.',
  })
  @ApiParam({ name: 'id', description: 'ID материала', example: 18 })
  @ApiOkResponse({ description: 'Материал удалён — в ответе удалённая запись', type: MaterialResponseDto })
  @ApiError(404, 'Материал не найден')
  @ApiError(
    409,
    'Материал используется (товаров: 10, позиций в заказах: 1). Отключите его через isActive = false — покупатели перестанут его видеть',
  )
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.materialsService.remove(id);
  }
}
