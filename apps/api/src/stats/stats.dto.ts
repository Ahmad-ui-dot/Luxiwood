import { Model3dKey, OrderStatus } from '@luxiwood/shared';
import { ApiProperty } from '@nestjs/swagger';

export class MonthCompareDto {
  @ApiProperty({ description: 'Текущий месяц', type: 'integer', example: 25700 })
  current: number;

  @ApiProperty({ description: 'Прошлый месяц', type: 'integer', example: 18900 })
  previous: number;

  @ApiProperty({ description: 'Разница в процентах. null — в прошлом месяце было 0', type: 'integer', nullable: true, example: 36 })
  changePercent: number | null;
}

export class MonthRevenueDto {
  @ApiProperty({ description: 'Месяц, ГГГГ-ММ', example: '2026-10' })
  month: string;

  @ApiProperty({ description: 'Коротко по-русски', example: 'окт' })
  label: string;

  @ApiProperty({ description: 'Выручка, сомони', type: 'integer', example: 25700 })
  revenue: number;

  @ApiProperty({ description: 'Заказов', type: 'integer', example: 3 })
  orders: number;
}

export class TypeSalesDto {
  @ApiProperty({ description: 'Тип мебели', enum: Model3dKey, enumName: 'Model3dKey', example: 'sofa' })
  type: Model3dKey;

  @ApiProperty({ description: 'Название', example: 'Диван' })
  label: string;

  @ApiProperty({ description: 'Продано штук', type: 'integer', example: 4 })
  quantity: number;

  @ApiProperty({ description: 'Выручка, сомони', type: 'integer', example: 36400 })
  revenue: number;
}

export class TopProductDto {
  @ApiProperty({ description: 'ID товара', type: 'integer', example: 1 })
  productId: number;

  @ApiProperty({ description: 'Название', example: 'Диван трёхместный «Ором»' })
  name: string;

  @ApiProperty({ description: 'slug', example: 'divan-orom' })
  slug: string;

  @ApiProperty({ description: 'Продано штук', type: 'integer', example: 3 })
  quantity: number;

  @ApiProperty({ description: 'Выручка, сомони', type: 'integer', example: 26700 })
  revenue: number;

  @ApiProperty({ description: 'Первое фото товара или null', type: String, nullable: true, example: null })
  image: string | null;
}

export class DayRevenueDto {
  @ApiProperty({ description: 'Число месяца', type: 'integer', example: 2 })
  day: number;

  @ApiProperty({ description: 'Выручка, сомони', type: 'integer', example: 8900 })
  revenue: number;

  @ApiProperty({ description: 'Заказов', type: 'integer', example: 1 })
  orders: number;
}

export class StatusCountDto {
  @ApiProperty({ description: 'Этап', enum: OrderStatus, enumName: 'OrderStatus', example: 'NEW' })
  status: OrderStatus;

  @ApiProperty({ description: 'Этап по-русски', example: 'Принят' })
  label: string;

  @ApiProperty({ description: 'Заказов на этом этапе', type: 'integer', example: 2 })
  count: number;
}

export class RatingDto {
  @ApiProperty({ description: 'Средняя оценка показанных отзывов, 0 — отзывов нет', example: 4.7 })
  average: number;

  @ApiProperty({ description: 'Число показанных отзывов', type: 'integer', example: 15 })
  count: number;
}

export class MonthPurchaseDto {
  @ApiProperty({ description: 'ID заказа', type: 'integer', example: 3 })
  orderId: number;

  @ApiProperty({ description: 'Номер заказа', example: 'LX-2026-0003' })
  number: string;

  @ApiProperty({ description: 'Имя покупателя', example: 'Фарход' })
  customerName: string;

  @ApiProperty({ description: 'Этап заказа', enum: OrderStatus, enumName: 'OrderStatus', example: 'FRAME' })
  status: OrderStatus;

  @ApiProperty({ description: 'Когда оформлен', type: String, format: 'date-time', example: '2026-11-01T08:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Что купили', example: 'Диван' })
  title: string;

  @ApiProperty({ description: 'ID товара, null — мебель из конструктора', type: 'integer', nullable: true, example: 1 })
  productId: number | null;

  @ApiProperty({ description: 'Штук', type: 'integer', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Сумма позиции, сомони', type: 'integer', example: 8900 })
  total: number;
}

export class LastOrderDto {
  @ApiProperty({ description: 'ID заказа', type: 'integer', example: 3 })
  id: number;

  @ApiProperty({ description: 'Номер', example: 'LX-2026-0003' })
  number: string;

  @ApiProperty({ description: 'Имя покупателя', example: 'Мадина' })
  customerName: string;

  @ApiProperty({ description: 'Этап', enum: OrderStatus, enumName: 'OrderStatus', example: 'FRAME' })
  status: OrderStatus;

  @ApiProperty({ description: 'Этап по-русски', example: 'Каркас' })
  statusLabel: string;

  @ApiProperty({ description: 'Итого, сомони', type: 'integer', example: 6800 })
  total: number;

  @ApiProperty({ description: 'Когда оформлен', type: String, format: 'date-time', example: '2026-10-27T08:30:00.000Z' })
  createdAt: string;
}

export class StatsDto {
  @ApiProperty({ description: 'Текущий месяц по-русски', example: 'Ноябрь 2026' })
  monthLabel: string;

  @ApiProperty({ description: 'Продано штук мебели за текущий и прошлый месяц', type: MonthCompareDto, example: { current: 5, previous: 3, changePercent: 67 } })
  itemsSold: MonthCompareDto;

  @ApiProperty({ description: 'Новых зарегистрированных покупателей за текущий и прошлый месяц', type: MonthCompareDto, example: { current: 2, previous: 1, changePercent: 100 } })
  newClients: MonthCompareDto;

  @ApiProperty({ description: 'Оценка магазина по отзывам', type: RatingDto })
  rating: RatingDto;

  @ApiProperty({ description: 'Сколько заказов на каждом этапе, за всё время', type: [StatusCountDto] })
  ordersByStatus: StatusCountDto[];

  @ApiProperty({ description: 'Выручка по дням текущего месяца, с 1-го числа до сегодня', type: [DayRevenueDto] })
  revenueByDay: DayRevenueDto[];

  @ApiProperty({ description: 'Рейтинг продаж за текущий месяц, до 10 товаров', type: [TopProductDto] })
  monthTopProducts: TopProductDto[];

  @ApiProperty({ description: 'Что купили за текущий месяц: позиции заказов, новые сверху, до 50', type: [MonthPurchaseDto] })
  monthPurchases: MonthPurchaseDto[];

  @ApiProperty({ description: 'Выручка за текущий и прошлый месяц, сомони (без отменённых)', type: MonthCompareDto })
  revenue: MonthCompareDto;

  @ApiProperty({ description: 'Число заказов за текущий и прошлый месяц (без отменённых)', type: MonthCompareDto, example: { current: 3, previous: 2, changePercent: 50 } })
  orders: MonthCompareDto;

  @ApiProperty({ description: 'Средний чек за текущий месяц, сомони', type: 'integer', example: 8567 })
  averageCheck: number;

  @ApiProperty({ description: 'В работе: каркас, сборка, обивка, в пути', type: 'integer', example: 2 })
  inWork: number;

  @ApiProperty({ description: 'Новые, ещё не взятые в работу', type: 'integer', example: 1 })
  newOrders: number;

  @ApiProperty({ description: 'Выручка по месяцам за последние 6 месяцев, от старого к новому', type: [MonthRevenueDto] })
  revenueByMonth: MonthRevenueDto[];

  @ApiProperty({ description: 'Продажи по типам мебели за всё время', type: [TypeSalesDto] })
  salesByType: TypeSalesDto[];

  @ApiProperty({ description: 'Рейтинг продаж за всё время, до 10 товаров', type: [TopProductDto] })
  topProducts: TopProductDto[];

  @ApiProperty({ description: '5 последних заказов', type: [LastOrderDto] })
  lastOrders: LastOrderDto[];
}
