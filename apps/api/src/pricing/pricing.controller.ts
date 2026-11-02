import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiError } from '../common/api-error.decorator';
import { FitDto, QuoteDto } from './dto/pricing.dto';
import { FitResponseDto, QuoteResponseDto } from './dto/pricing.response.dto';
import { PricingService } from './pricing.service';

@ApiTags('Расчёт цены')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('quote')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Цена товара с выбранными вариантами',
    description:
      'Доступно всем, без входа. Цена за штуку = базовая цена + доплаты за материал, цвет, дерево и размер; итого = цена × количество. ' +
      'Материал, цвет, дерево и размер должны быть из списка разрешённых у товара (GET /api/products/:slug). ' +
      'Цвет, дерево и размер можно не присылать — возьмутся значения по умолчанию (они вернутся в selection). ' +
      'Ту же формулу сервер использует при оформлении заказа.',
  })
  @ApiBody({
    type: QuoteDto,
    examples: {
      basic: { summary: 'Диван «Ором» по умолчанию — 8 900 сомони', value: { productId: 1, mainMaterialId: 1, quantity: 1 } },
      full: { summary: 'Велюр, Карамель, Орех, 2 шт.', value: { productId: 1, mainMaterialId: 2, colorMaterialId: 6, woodMaterialId: 11, sizeId: 2, quantity: 2 } },
    },
  })
  @ApiOkResponse({ description: 'Цена с расшифровкой', type: QuoteResponseDto })
  @ApiError(
    400,
    { message: 'Проверьте введённые данные', errors: ['Количество — от 1 до 99'] },
    'Этот материал недоступен для товара',
    'Этот размер недоступен для товара',
  )
  @ApiError(404, 'Товар не найден')
  quote(@Body() dto: QuoteDto) {
    return this.pricingService.quote(dto);
  }

  @Post('fit')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Встанет ли у вас?',
    description:
      'Доступно всем, без входа. Сравнивает ширину товара в выбранном размере с шириной ниши. ' +
      'Встанет — если остаётся хотя бы 20 см на проход и монтаж; меньше — «впритык»; отрицательный запас — не встанет.',
  })
  @ApiBody({
    type: FitDto,
    examples: {
      fits: { summary: 'Ниша 230 см под диван 210 см', value: { productId: 1, sizeId: 2, nicheWidthCm: 230 } },
      tight: { summary: 'Впритык', value: { productId: 1, sizeId: 2, nicheWidthCm: 215 } },
    },
  })
  @ApiOkResponse({ description: 'Результат примерки', type: FitResponseDto })
  @ApiError(400, { message: 'Проверьте введённые данные', errors: ['Ширина ниши — от 1 до 2000 см'] }, 'Этот размер недоступен для товара')
  @ApiError(404, 'Товар не найден')
  fit(@Body() dto: FitDto) {
    return this.pricingService.fit(dto);
  }
}
