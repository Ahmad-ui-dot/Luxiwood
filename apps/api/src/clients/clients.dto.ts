import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../common/pagination';
import { AdminOrderListItemDto } from '../orders/dto/order.response.dto';

export const CLIENT_SORTS = ['new', 'spent', 'orders'] as const;
export type ClientSort = (typeof CLIENT_SORTS)[number];

export class ClientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Поиск по имени, телефону или email', maxLength: 100, example: 'Мадина' })
  @IsOptional()
  @IsString({ message: 'Поиск должен быть строкой' })
  @MaxLength(100, { message: 'Поиск — не длиннее 100 символов' })
  search?: string;

  @ApiPropertyOptional({ description: 'Порядок: new — новые сверху, spent — по сумме покупок, orders — по числу заказов', enum: CLIENT_SORTS, default: 'new', example: 'spent' })
  @IsOptional()
  @IsIn(CLIENT_SORTS, { message: 'sort: new, spent или orders' })
  sort?: ClientSort;

  @ApiPropertyOptional({ description: 'true — только с заказами, false — только без заказов', enum: ['true', 'false'], example: 'true' })
  @IsOptional()
  @IsIn(['true', 'false'], { message: 'hasOrders: true или false' })
  hasOrders?: 'true' | 'false';
}

export class ClientDto {
  @ApiProperty({ description: 'ID клиента', type: 'integer', example: 2 })
  id: number;

  @ApiProperty({ description: 'Имя', example: 'Мадина' })
  name: string;

  @ApiProperty({ description: 'Телефон', type: String, nullable: true, example: '+992930000001' })
  phone: string | null;

  @ApiProperty({ description: 'Email', type: String, nullable: true, example: 'client@luxiwood.tj' })
  email: string | null;

  @ApiProperty({ description: 'Сколько заказов оформлено со входом', type: 'integer', example: 2 })
  ordersCount: number;

  @ApiProperty({ description: 'Сумма покупок без отменённых заказов, сомони', type: 'integer', example: 15700 })
  totalSpent: number;

  @ApiProperty({ description: 'Когда был последний заказ. null — заказов нет', type: String, format: 'date-time', nullable: true, example: '2026-10-27T08:30:00.000Z' })
  lastOrderAt: string | null;

  @ApiProperty({ description: 'Дата регистрации', type: String, format: 'date-time', example: '2026-09-01T10:00:00.000Z' })
  createdAt: string;
}

export class ClientDetailsDto extends ClientDto {
  @ApiProperty({ description: 'Адрес доставки по умолчанию', type: String, nullable: true, example: 'Душанбе, ул. Рудаки, 10' })
  defaultAddress: string | null;

  @ApiProperty({ description: 'Заказы клиента, новые сверху', type: [AdminOrderListItemDto] })
  orders: AdminOrderListItemDto[];
}
