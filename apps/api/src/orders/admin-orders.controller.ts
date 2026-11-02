import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { AuthUser } from '../auth/auth.guard';
import { ApiError, ApiValidationError } from '../common/api-error.decorator';
import { ApiPaginatedResponse } from '../common/dto/paginated-response.dto';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { AdminOrderQueryDto, UpdateOrderDto, UpdateOrderNoteDto, UpdateOrderStatusDto } from './dto/order.dto';
import { AdminOrderDto, AdminOrderListItemDto, DeleteOrderResultDto } from './dto/order.response.dto';
import { OrdersService } from './orders.service';

const ID_PARAM = { name: 'id', description: 'ID заказа', example: 1 };

@ApiTags('Админ: заказы')
@Roles('ADMIN')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Все заказы',
    description: 'Только администратор. Фильтры: этап, поиск по номеру, имени или телефону, даты оформления от/до. Новые — сверху.',
  })
  @ApiPaginatedResponse(AdminOrderListItemDto, 'Страница списка заказов')
  @ApiValidationError('Статус: NEW, FRAME, ASSEMBLY, UPHOLSTERY, DELIVERING, DONE или CANCELLED')
  findAll(@Query() query: AdminOrderQueryDto) {
    return this.ordersService.findAllForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка заказа', description: 'Только администратор. Все поля, позиции с материалами и снимком расчёта, история этапов, заметка.' })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ description: 'Заказ', type: AdminOrderDto })
  @ApiError(404, 'Заказ не найден')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.ordersService.findOneForAdmin(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Сменить этап заказа',
    description:
      'Только администратор. Только вперёд: NEW → FRAME → ASSEMBLY → UPHOLSTERY → DELIVERING → DONE (этап можно пропустить, например «Обивку» у стола). ' +
      'CANCELLED — из любого незавершённого этапа. Из DONE и CANCELLED перейти нельзя. Каждая смена записывается в историю.',
  })
  @ApiParam(ID_PARAM)
  @ApiBody({ type: UpdateOrderStatusDto, examples: { frame: { summary: 'В работу: каркас', value: { status: 'FRAME' } }, cancel: { summary: 'Отменить', value: { status: 'CANCELLED' } } } })
  @ApiOkResponse({ description: 'Этап изменён', type: AdminOrderDto })
  @ApiError(
    400,
    'Нельзя вернуть заказ с этапа «Сборка» на этап «Каркас»',
    'Заказ в статусе «Доставлен» больше нельзя менять',
    'Заказ уже на этапе «Каркас»',
  )
  @ApiError(404, 'Заказ не найден')
  updateStatus(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateOrderStatusDto, @CurrentUser() admin: AuthUser) {
    return this.ordersService.updateStatus(id, dto.status, admin.id);
  }

  @Patch(':id/note')
  @ApiOperation({ summary: 'Заметка к заказу', description: 'Только администратор. Внутренняя заметка мастерской, покупатель её не видит. Пустая строка удаляет заметку.' })
  @ApiParam(ID_PARAM)
  @ApiBody({ type: UpdateOrderNoteDto, examples: { note: { summary: 'Заметка', value: { adminNote: 'Клиент просил ткань чуть темнее образца' } } } })
  @ApiOkResponse({ description: 'Заметка сохранена', type: AdminOrderDto })
  @ApiValidationError('Заметка — не длиннее 1000 символов')
  @ApiError(404, 'Заказ не найден')
  updateNote(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateOrderNoteDto) {
    return this.ordersService.updateNote(id, dto.adminNote);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Исправить данные доставки',
    description: 'Только администратор. Имя, телефон, адрес, дата доставки. Состав и цены не меняются. Завершённый или отменённый заказ изменить нельзя.',
  })
  @ApiParam(ID_PARAM)
  @ApiBody({ type: UpdateOrderDto, examples: { address: { summary: 'Новый адрес и дата', value: { address: 'Душанбе, ул. Айни, 25, кв. 4', deliveryDate: '2026-11-25' } } } })
  @ApiOkResponse({ description: 'Заказ изменён', type: AdminOrderDto })
  @ApiError(400, { message: 'Проверьте введённые данные', errors: ['Неверный формат телефона. Пример: +992 90 123 45 67'] }, 'Дата доставки — не раньше завтрашнего дня и не позже чем через 180 дней')
  @ApiError(404, 'Заказ не найден')
  @ApiError(409, 'Заказ в статусе «Доставлен» уже нельзя изменить')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить заказ', description: 'Только администратор. Удаляются только отменённые заказы (CANCELLED) — вместе с позициями и историей.' })
  @ApiParam(ID_PARAM)
  @ApiOkResponse({ description: 'Заказ удалён', type: DeleteOrderResultDto })
  @ApiError(404, 'Заказ не найден')
  @ApiError(409, 'Удалить можно только отменённый заказ. Сначала переведите его в статус CANCELLED')
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.ordersService.remove(id);
  }
}
