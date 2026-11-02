import { Model3dKey, Order, OrderCreated, OrderStatus, Payment } from '@luxiwood/shared';
import { ApiProperty, OmitType } from '@nestjs/swagger';

export class OrderCreatedDto implements OrderCreated {
  @ApiProperty({ description: 'Номер заказа — по нему и телефону покупатель следит за заказом', example: 'LX-2026-0001' })
  number: string;

  @ApiProperty({ description: 'Этап — у нового заказа всегда NEW («Принят»)', enum: OrderStatus, enumName: 'OrderStatus', example: 'NEW' })
  status: OrderStatus;

  @ApiProperty({ description: 'Сумма товаров, сомони', type: 'integer', example: 8900 })
  subtotal: number;

  @ApiProperty({ description: 'Доставка, сомони. 0 — бесплатно (сумма товаров от порога)', type: 'integer', example: 0 })
  deliveryPrice: number;

  @ApiProperty({ description: 'Итого к оплате при получении, сомони', type: 'integer', example: 8900 })
  total: number;
}

export class OrderItemDto {
  @ApiProperty({ description: 'ID позиции', type: 'integer', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID товара. null — мебель из конструктора или товар удалён', type: 'integer', nullable: true, example: 1 })
  productId: number | null;

  @ApiProperty({ description: 'Название позиции', example: 'Диван трёхместный «Ором» · Букле, Карамель, Дуб · 210 см' })
  title: string;

  @ApiProperty({ description: 'Тип мебели', enum: Model3dKey, enumName: 'Model3dKey', example: 'sofa' })
  model3dKey: Model3dKey;

  @ApiProperty({ description: 'Опции конструктора', type: [String], example: [] })
  options: string[];

  @ApiProperty({ description: 'Количество', type: 'integer', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Цена за штуку на момент заказа, сомони', type: 'integer', example: 8900 })
  unitPrice: number;
}

export class OrderHistoryDto {
  @ApiProperty({ description: 'Этап', enum: OrderStatus, enumName: 'OrderStatus', example: 'FRAME' })
  status: OrderStatus;

  @ApiProperty({ description: 'Этап по-русски', example: 'Каркас' })
  label: string;

  @ApiProperty({ description: 'Когда заказ перешёл на этап', type: String, format: 'date-time', example: '2026-10-28T10:00:00.000Z' })
  changedAt: string;
}

// Заказ глазами покупателя
export class OrderDto implements Order {
  @ApiProperty({ description: 'ID заказа', type: 'integer', example: 1 })
  id: number;

  @ApiProperty({ description: 'Номер заказа', example: 'LX-2026-0001' })
  number: string;

  @ApiProperty({ description: 'Имя покупателя', example: 'Мадина' })
  customerName: string;

  @ApiProperty({ description: 'Телефон без пробелов', example: '+992930000001' })
  phone: string;

  @ApiProperty({ description: 'Адрес доставки', example: 'Душанбе, ул. Рудаки, 10' })
  address: string;

  @ApiProperty({ description: 'Комментарий покупателя', type: String, nullable: true, example: 'Позвонить за час' })
  comment: string | null;

  @ApiProperty({ description: 'Желаемая дата доставки', type: String, format: 'date', nullable: true, example: '2026-11-20' })
  deliveryDate: string | null;

  @ApiProperty({ description: 'Оплата при получении', enum: Payment, enumName: 'Payment', example: 'CASH' })
  payment: Payment;

  @ApiProperty({ description: 'Текущий этап', enum: OrderStatus, enumName: 'OrderStatus', example: 'FRAME' })
  status: OrderStatus;

  @ApiProperty({ description: 'Текущий этап по-русски', example: 'Каркас' })
  statusLabel: string;

  @ApiProperty({ description: 'Сумма товаров, сомони', type: 'integer', example: 8900 })
  subtotal: number;

  @ApiProperty({ description: 'Доставка, сомони', type: 'integer', example: 0 })
  deliveryPrice: number;

  @ApiProperty({ description: 'Итого, сомони', type: 'integer', example: 8900 })
  total: number;

  @ApiProperty({ description: 'Позиции', type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ description: 'История этапов, от первого к последнему', type: [OrderHistoryDto] })
  history: OrderHistoryDto[];

  @ApiProperty({ description: 'Когда оформлен', type: String, format: 'date-time', example: '2026-10-27T08:30:00.000Z' })
  createdAt: string;
}

// Отслеживание без входа: без адреса и телефона
export class OrderTrackDto {
  @ApiProperty({ description: 'Номер заказа', example: 'LX-2026-0001' })
  number: string;

  @ApiProperty({ description: 'Текущий этап', enum: OrderStatus, enumName: 'OrderStatus', example: 'DELIVERING' })
  status: OrderStatus;

  @ApiProperty({ description: 'Текущий этап по-русски', example: 'В пути' })
  statusLabel: string;

  @ApiProperty({ description: 'Желаемая дата доставки', type: String, format: 'date', nullable: true, example: '2026-11-20' })
  deliveryDate: string | null;

  @ApiProperty({ description: 'Итого, сомони', type: 'integer', example: 3050 })
  total: number;

  @ApiProperty({ description: 'Позиции', type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ description: 'История этапов', type: [OrderHistoryDto] })
  history: OrderHistoryDto[];

  @ApiProperty({ description: 'Когда оформлен', type: String, format: 'date-time', example: '2026-10-18T08:30:00.000Z' })
  createdAt: string;
}

// ---------- Админка ----------

export class AdminOrderListItemDto {
  @ApiProperty({ description: 'ID заказа', type: 'integer', example: 1 })
  id: number;

  @ApiProperty({ description: 'Номер', example: 'LX-2026-0001' })
  number: string;

  @ApiProperty({ description: 'Имя покупателя', example: 'Мадина' })
  customerName: string;

  @ApiProperty({ description: 'Телефон', example: '+992930000001' })
  phone: string;

  @ApiProperty({ description: 'Этап', enum: OrderStatus, enumName: 'OrderStatus', example: 'NEW' })
  status: OrderStatus;

  @ApiProperty({ description: 'Этап по-русски', example: 'Принят' })
  statusLabel: string;

  @ApiProperty({ description: 'Итого, сомони', type: 'integer', example: 8900 })
  total: number;

  @ApiProperty({ description: 'Сколько позиций', type: 'integer', example: 2 })
  itemsCount: number;

  @ApiProperty({ description: 'Желаемая дата доставки', type: String, format: 'date', nullable: true, example: '2026-11-20' })
  deliveryDate: string | null;

  @ApiProperty({ description: 'Когда оформлен', type: String, format: 'date-time', example: '2026-10-27T08:30:00.000Z' })
  createdAt: string;
}

export class AdminOrderItemDto extends OrderItemDto {
  @ApiProperty({ description: 'ID основного материала (ткани или дерева)', type: 'integer', nullable: true, example: 1 })
  mainMaterialId: number | null;

  @ApiProperty({ description: 'ID цвета', type: 'integer', nullable: true, example: 6 })
  colorMaterialId: number | null;

  @ApiProperty({ description: 'ID дерева', type: 'integer', nullable: true, example: 10 })
  woodMaterialId: number | null;

  @ApiProperty({ description: 'ID покрытия (конструктор)', type: 'integer', nullable: true, example: null })
  finishMaterialId: number | null;

  @ApiProperty({ description: 'ID размера товара', type: 'integer', nullable: true, example: 2 })
  sizeId: number | null;

  @ApiProperty({ description: 'Конструктор: ширина, см', type: 'integer', nullable: true, example: null })
  customWidthCm: number | null;

  @ApiProperty({ description: 'Конструктор: глубина, см', type: 'integer', nullable: true, example: null })
  customDepthCm: number | null;

  @ApiProperty({ description: 'Конструктор: высота, см', type: 'integer', nullable: true, example: null })
  customHeightCm: number | null;

  @ApiProperty({
    description: 'Снимок выбора и расчёта цены на момент заказа (названия материалов, размер, строки расчёта)',
    type: 'object',
    additionalProperties: true,
    example: { kind: 'product', sku: 'LX-101', size: '210 см', breakdown: [{ label: 'Базовая цена', amount: 8900 }] },
  })
  snapshot: Record<string, unknown>;
}

// Как OrderDto, но позиции подробнее — с материалами и снимком расчёта
export class AdminOrderDto extends OmitType(OrderDto, ['items'] as const) {
  @ApiProperty({ description: 'ID покупателя, если он был залогинен. null — гость', type: 'integer', nullable: true, example: 2 })
  userId: number | null;

  @ApiProperty({ description: 'Заметка мастерской', type: String, nullable: true, example: 'Клиент просил ткань чуть темнее' })
  adminNote: string | null;

  @ApiProperty({ description: 'Позиции с материалами и снимком расчёта', type: [AdminOrderItemDto] })
  items: AdminOrderItemDto[];

  @ApiProperty({ description: 'Когда изменён', type: String, format: 'date-time', example: '2026-10-28T10:00:00.000Z' })
  updatedAt: string;
}

export class DeleteOrderResultDto {
  @ApiProperty({ description: 'Номер удалённого заказа', example: 'LX-2026-0004' })
  number: string;

  @ApiProperty({ description: 'Что произошло', example: 'Заказ удалён' })
  message: string;
}
