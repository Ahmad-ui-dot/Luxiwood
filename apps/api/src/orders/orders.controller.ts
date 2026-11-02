import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Auth, CurrentUser, OptionalAuth } from '../auth/auth.decorators';
import { AuthUser } from '../auth/auth.guard';
import { ApiError, ApiValidationError } from '../common/api-error.decorator';
import { ApiPaginatedResponse } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/pagination';
import { CreateOrderDto, TrackOrderQueryDto } from './dto/order.dto';
import { OrderCreatedDto, OrderDto, OrderTrackDto } from './dto/order.response.dto';
import { OrdersService } from './orders.service';

const NUMBER_PARAM = { name: 'number', description: 'Номер заказа', example: 'LX-2026-0003' };

@ApiTags('Заказы')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @OptionalAuth()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Оформить заказ',
    description:
      'Доступно всем: гостю и покупателю со входом (токен не обязателен; если он передан, заказ попадёт в «Мои заказы»). ' +
      'Каждая позиция — либо товар из каталога (productId + материалы + размер), либо мебель из конструктора (type + размеры + материалы + опции). ' +
      'Сервер сам проверяет, что варианты разрешены и материалы не отключены, и сам считает цены и доставку — цены от сайта не принимаются. ' +
      'Новый заказ получает статус NEW и номер LX-<год>-<4 цифры>. Не больше 5 заказов в минуту с одного IP.',
  })
  @ApiBody({
    type: CreateOrderDto,
    examples: {
      product: {
        summary: 'Товар из каталога',
        value: {
          customerName: 'Мадина',
          phone: '+992 93 000 00 01',
          address: 'Душанбе, ул. Рудаки, 10',
          deliveryDate: '2026-11-20',
          payment: 'CASH',
          comment: 'Позвонить за час',
          items: [{ productId: 1, mainMaterialId: 1, colorMaterialId: 6, woodMaterialId: 10, sizeId: 2, quantity: 1 }],
        },
      },
      mixed: {
        summary: 'Товар + шкаф из конструктора',
        value: {
          customerName: 'Фарход',
          phone: '+992 90 123 45 67',
          address: 'Душанбе, ул. Айни, 25',
          payment: 'CARD',
          items: [
            { productId: 20, mainMaterialId: 10, quantity: 1 },
            { type: 'wardrobe', widthCm: 160, depthCm: 60, heightCm: 215, woodMaterialId: 11, finishMaterialId: 15, options: ['wardrobe-mirror'], quantity: 1 },
          ],
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Заказ оформлен', type: OrderCreatedDto })
  @ApiError(
    400,
    { message: 'Проверьте введённые данные', errors: ['Неверный формат телефона. Пример: +992 90 123 45 67'] },
    'Позиция 1: этот материал недоступен для товара',
    'Позиция 2: ширина шкафа должна быть целым числом от 60 до 300 см',
    'Позиция 1: укажите либо productId (товар из каталога), либо type (мебель из конструктора)',
    'Дата доставки — не раньше завтрашнего дня и не позже чем через 180 дней',
  )
  @ApiError(429, 'Слишком много запросов. Попробуйте через минуту')
  create(@Body() dto: CreateOrderDto, @CurrentUser() user?: AuthUser) {
    return this.ordersService.create(dto, user?.id ?? null);
  }

  @Get('track')
  @ApiOperation({
    summary: 'Где мой заказ',
    description:
      'Доступно всем, без входа. По номеру и телефону из заказа — этап, история этапов, состав и сумма. ' +
      'При неверном телефоне — 404 без подсказки, существует ли такой номер.',
  })
  @ApiOkResponse({ description: 'Заказ', type: OrderTrackDto })
  @ApiValidationError('Неверный формат телефона. Пример: +992 90 123 45 67')
  @ApiError(404, 'Заказ не найден. Проверьте номер и телефон')
  track(@Query() query: TrackOrderQueryDto) {
    return this.ordersService.track(query);
  }
}

@ApiTags('Мой кабинет')
@Auth()
@Controller('me/orders')
export class MyOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Мои заказы', description: 'Нужен вход. Заказы, оформленные со входом, с историей этапов. Новые — сверху.' })
  @ApiPaginatedResponse(OrderDto, 'Страница моих заказов')
  findAll(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.ordersService.findMine(user.id, query);
  }

  @Get(':number')
  @ApiOperation({ summary: 'Мой заказ', description: 'Нужен вход. Чужой заказ отдаёт 404.' })
  @ApiParam(NUMBER_PARAM)
  @ApiOkResponse({ description: 'Заказ', type: OrderDto })
  @ApiError(404, 'Заказ не найден')
  findOne(@CurrentUser() user: AuthUser, @Param('number') number: string) {
    return this.ordersService.findMineByNumber(user.id, number);
  }

  @Post(':number/cancel')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Отменить мой заказ',
    description: 'Нужен вход. Отменить можно только пока заказ на этапе NEW («Принят»). Потом — только по телефону мастерской.',
  })
  @ApiParam(NUMBER_PARAM)
  @ApiOkResponse({ description: 'Заказ отменён (статус CANCELLED)', type: OrderDto })
  @ApiError(404, 'Заказ не найден')
  @ApiError(409, 'Заказ уже на этапе «Каркас» — отменить его можно только по телефону мастерской')
  cancel(@CurrentUser() user: AuthUser, @Param('number') number: string) {
    return this.ordersService.cancelMine(user.id, number);
  }
}
