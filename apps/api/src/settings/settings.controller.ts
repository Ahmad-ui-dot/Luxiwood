import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators';
import { ApiError } from '../common/api-error.decorator';
import { AdminSettingsDto, PublicSettingsDto, UpdateSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Настройки')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({
    summary: 'Доставка и контакты',
    description: 'Доступно всем, без входа. Для корзины (цена доставки и порог бесплатной) и подвала сайта (телефон, часы работы).',
  })
  @ApiOkResponse({ description: 'Настройки для сайта', type: PublicSettingsDto })
  getPublic() {
    return this.settingsService.getPublic();
  }
}

@ApiTags('Админ: настройки')
@Roles('ADMIN')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Все настройки', description: 'Только администратор. Доставка, контакты и цены конструктора.' })
  @ApiOkResponse({ description: 'Настройки', type: AdminSettingsDto })
  getAll() {
    return this.settingsService.getAll();
  }

  @Patch()
  @ApiOperation({
    summary: 'Изменить настройки',
    description:
      'Только администратор. Меняются только переданные поля. Все цены — целые сомони от 0. ' +
      'Следующий расчёт цены и следующий заказ сразу используют новые значения; старые заказы не меняются.',
  })
  @ApiBody({
    type: UpdateSettingsDto,
    examples: {
      delivery: { summary: 'Доставка', value: { deliveryPrice: 200, freeDeliveryFrom: 6000 } },
      configurator: {
        summary: 'Цены конструктора',
        value: {
          configuratorBasePrices: { sofa: 8200, armchair: 3300, bed: 6400, wardrobe: 7100, table: 2800 },
          configuratorOptionPrices: { 'sofa-mechanism': 1300 },
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Настройки после изменения', type: AdminSettingsDto })
  @ApiError(
    400,
    { message: 'Проверьте введённые данные', errors: ['Цена доставки — целое число сомони'] },
    'Нет такой опции конструктора: «sofa-wings»',
  )
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
