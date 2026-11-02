import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiError } from '../common/api-error.decorator';
import { ConfiguratorService } from './configurator.service';
import { ConfiguratorOptionsDto, ConfiguratorQuoteDto, ConfiguratorQuoteResponseDto } from './dto/configurator.dto';

@ApiTags('Конструктор')
@Controller('configurator')
export class ConfiguratorController {
  constructor(private readonly configuratorService: ConfiguratorService) {}

  @Get('options')
  @ApiOperation({
    summary: 'Что можно собрать в конструкторе',
    description:
      'Доступно всем, без входа. Для каждого типа (диван, кресло, кровать, шкаф, стол): диапазоны и значения по умолчанию ' +
      'ширины, глубины и высоты, цена по умолчанию, срок, ткани и цвета (только мягкая мебель), породы дерева, покрытия, опции с ценами.',
  })
  @ApiOkResponse({ description: 'Параметры конструктора', type: ConfiguratorOptionsDto })
  options() {
    return this.configuratorService.options();
  }

  @Post('quote')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Цена мебели из конструктора',
    description:
      'Доступно всем, без входа. Формула (packages/shared/src/configurator.ts): основа = цена типа × (объём / объём по умолчанию); ' +
      'доплаты за ткань, цвет, дерево и покрытие растут вместе с размером; опции — фиксированная цена; итог округляется вверх до 10 сомони. ' +
      'Размер вне диапазона, чужая опция или недоступный материал — 400 с понятным текстом. Цены берутся из настроек администратора.',
  })
  @ApiBody({
    type: ConfiguratorQuoteDto,
    examples: {
      sofa: {
        summary: 'Диван 230 см, велюр, механизм',
        value: { type: 'sofa', widthCm: 230, depthCm: 95, heightCm: 85, upholsteryMaterialId: 2, colorMaterialId: 5, woodMaterialId: 11, finishMaterialId: 16, options: ['sofa-mechanism'] },
      },
      wardrobe: {
        summary: 'Шкаф 160×60×215 под нишу',
        value: { type: 'wardrobe', widthCm: 160, depthCm: 60, heightCm: 215, woodMaterialId: 10, finishMaterialId: 15, options: ['wardrobe-mirror'] },
      },
    },
  })
  @ApiOkResponse({ description: 'Цена, срок и состав', type: ConfiguratorQuoteResponseDto })
  @ApiError(
    400,
    'Ширина дивана должна быть целым числом от 140 до 320 см',
    'Выберите ткань обивки для: диван',
    'Опция «bed-lift» недоступна для типа «Диван»',
    'Дерево: материал с ID 99 не найден или отключён',
  )
  quote(@Body() dto: ConfiguratorQuoteDto) {
    return this.configuratorService.quote(dto);
  }
}
