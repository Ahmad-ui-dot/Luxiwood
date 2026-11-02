import { CONFIGURATOR_KEYS, ConfiguratorKey, OrderStatus, Payment, PHONE_ERROR, QUANTITY_LIMITS } from '@luxiwood/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PHONE_PATTERN } from '../../auth/dto/auth.dto';
import { PaginationQueryDto } from '../../common/pagination';
import { Trim } from '../../common/query-transforms';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Позиция заказа: либо товар из каталога (productId), либо мебель из конструктора (type)
export class OrderItemInputDto {
  @ApiPropertyOptional({ description: 'Товар из каталога: ID товара. Не указывается вместе с type', type: 'integer', minimum: 1, example: 1 })
  @IsOptional()
  @IsInt({ message: 'ID товара — целое число' })
  @Min(1, { message: 'ID товара — целое число' })
  productId?: number;

  @ApiPropertyOptional({ description: 'Товар: ID основного материала (обязателен для товара)', type: 'integer', example: 1 })
  @IsOptional()
  @IsInt({ message: 'ID материала — целое число' })
  mainMaterialId?: number;

  @ApiPropertyOptional({ description: 'Товар или конструктор: ID цвета обивки. Не указан — по умолчанию', type: 'integer', example: 6 })
  @IsOptional()
  @IsInt({ message: 'ID цвета — целое число' })
  colorMaterialId?: number;

  @ApiPropertyOptional({ description: 'Товар: ID дерева (не указан — по умолчанию). Конструктор: обязателен', type: 'integer', example: 10 })
  @IsOptional()
  @IsInt({ message: 'ID дерева — целое число' })
  woodMaterialId?: number;

  @ApiPropertyOptional({ description: 'Товар: ID размера. Не указан — по умолчанию', type: 'integer', example: 2 })
  @IsOptional()
  @IsInt({ message: 'ID размера — целое число' })
  sizeId?: number;

  @ApiPropertyOptional({ description: 'Конструктор: тип мебели. Не указывается вместе с productId', enum: CONFIGURATOR_KEYS, example: 'wardrobe' })
  @IsOptional()
  @IsIn(CONFIGURATOR_KEYS, { message: 'В конструкторе собираются только sofa, armchair, bed, wardrobe и table' })
  type?: ConfiguratorKey;

  @ApiPropertyOptional({ description: 'Конструктор: ширина, см', type: 'integer', example: 160 })
  @IsOptional()
  @IsInt({ message: 'Ширина — целое число сантиметров' })
  widthCm?: number;

  @ApiPropertyOptional({ description: 'Конструктор: глубина, см', type: 'integer', example: 60 })
  @IsOptional()
  @IsInt({ message: 'Глубина — целое число сантиметров' })
  depthCm?: number;

  @ApiPropertyOptional({ description: 'Конструктор: высота, см', type: 'integer', example: 215 })
  @IsOptional()
  @IsInt({ message: 'Высота — целое число сантиметров' })
  heightCm?: number;

  @ApiPropertyOptional({ description: 'Конструктор: ID ткани (для мягкой мебели)', type: 'integer', example: 2 })
  @IsOptional()
  @IsInt({ message: 'ID ткани — целое число' })
  upholsteryMaterialId?: number;

  @ApiPropertyOptional({ description: 'Конструктор: ID покрытия дерева (обязателен)', type: 'integer', example: 15 })
  @IsOptional()
  @IsInt({ message: 'ID покрытия — целое число' })
  finishMaterialId?: number;

  @ApiPropertyOptional({ description: 'Конструктор: ключи опций', type: [String], example: ['wardrobe-mirror'] })
  @IsOptional()
  @IsArray({ message: 'options — массив ключей опций' })
  @ArrayMaxSize(10, { message: 'Не больше 10 опций' })
  @IsString({ each: true, message: 'Каждая опция — строка-ключ' })
  options?: string[];

  @ApiProperty({ description: 'Количество', type: 'integer', minimum: QUANTITY_LIMITS.min, maximum: QUANTITY_LIMITS.max, example: 1 })
  @IsInt({ message: 'Количество — целое число' })
  @Min(QUANTITY_LIMITS.min, { message: `Количество — от ${QUANTITY_LIMITS.min} до ${QUANTITY_LIMITS.max}` })
  @Max(QUANTITY_LIMITS.max, { message: `Количество — от ${QUANTITY_LIMITS.min} до ${QUANTITY_LIMITS.max}` })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Имя покупателя', minLength: 2, maxLength: 100, example: 'Мадина' })
  @Trim()
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя — от 2 до 100 символов' })
  @MaxLength(100, { message: 'Имя — от 2 до 100 символов' })
  customerName: string;

  @ApiProperty({ description: 'Телефон: +992 и 9 цифр, пробелы допускаются', pattern: PHONE_PATTERN.source, example: '+992 93 000 00 01' })
  @Matches(PHONE_PATTERN, { message: PHONE_ERROR })
  phone: string;

  @ApiPropertyOptional({ description: 'Адрес в Душанбе. Необязательно: мастер уточнит его по телефону', minLength: 5, maxLength: 300, example: 'Душанбе, ул. Рудаки, 10' })
  @IsOptional()
  @Trim()
  @IsString({ message: 'Адрес должен быть строкой' })
  @MinLength(5, { message: 'Адрес — от 5 до 300 символов' })
  @MaxLength(300, { message: 'Адрес — от 5 до 300 символов' })
  address?: string;

  @ApiPropertyOptional({ description: 'Желаемая дата доставки, ГГГГ-ММ-ДД: не раньше завтра и не позже чем через 180 дней', format: 'date', example: '2026-11-20' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'Дата доставки — в формате ГГГГ-ММ-ДД' })
  deliveryDate?: string;

  @ApiPropertyOptional({ description: 'Оплата при получении: CASH — наличными, CARD — картой', enum: Payment, enumName: 'Payment', default: 'CASH', example: 'CASH' })
  @IsOptional()
  @IsEnum(Payment, { message: 'Оплата: CASH или CARD' })
  payment?: Payment;

  @ApiPropertyOptional({ description: 'Комментарий', maxLength: 500, example: 'Позвонить за час' })
  @IsOptional()
  @Trim()
  @IsString({ message: 'Комментарий должен быть строкой' })
  @MaxLength(500, { message: 'Комментарий — не длиннее 500 символов' })
  comment?: string;

  @ApiProperty({ description: 'Позиции: товары и мебель из конструктора, от 1 до 20. Цены не передаются — их считает сервер', type: [OrderItemInputDto] })
  @IsArray({ message: 'items — массив позиций' })
  @ArrayMinSize(1, { message: 'В заказе должна быть хотя бы одна позиция' })
  @ArrayMaxSize(20, { message: 'В заказе — не больше 20 позиций' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}

export class TrackOrderQueryDto {
  @ApiProperty({ description: 'Номер заказа', example: 'LX-2026-0001' })
  @Trim()
  @IsString({ message: 'Укажите номер заказа' })
  @MinLength(1, { message: 'Укажите номер заказа' })
  @MaxLength(20, { message: 'Номер заказа — не длиннее 20 символов' })
  number: string;

  @ApiProperty({ description: 'Телефон из заказа', pattern: PHONE_PATTERN.source, example: '+992 93 000 00 01' })
  @Matches(PHONE_PATTERN, { message: PHONE_ERROR })
  phone: string;
}

export class AdminOrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Этап заказа', enum: OrderStatus, enumName: 'OrderStatus', example: 'NEW' })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'Статус: NEW, FRAME, ASSEMBLY, UPHOLSTERY, DELIVERING, DONE или CANCELLED' })
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Поиск по номеру, имени или телефону', maxLength: 100, example: 'Мадина' })
  @IsOptional()
  @IsString({ message: 'Поиск должен быть строкой' })
  @MaxLength(100, { message: 'Поиск — не длиннее 100 символов' })
  search?: string;

  @ApiPropertyOptional({ description: 'Созданы не раньше, ГГГГ-ММ-ДД', format: 'date', example: '2026-10-01' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'dateFrom — в формате ГГГГ-ММ-ДД' })
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Созданы не позже, ГГГГ-ММ-ДД (включительно)', format: 'date', example: '2026-10-31' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'dateTo — в формате ГГГГ-ММ-ДД' })
  dateTo?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Новый этап. Только вперёд: NEW → FRAME → ASSEMBLY → UPHOLSTERY → DELIVERING → DONE (этап можно пропустить); CANCELLED — из любого незавершённого',
    enum: OrderStatus,
    enumName: 'OrderStatus',
    example: 'FRAME',
  })
  @IsEnum(OrderStatus, { message: 'Статус: NEW, FRAME, ASSEMBLY, UPHOLSTERY, DELIVERING, DONE или CANCELLED' })
  status: OrderStatus;
}

export class UpdateOrderNoteDto {
  @ApiProperty({ description: 'Заметка для мастерской. Покупатель её не видит. Пустая строка — удалить заметку', type: String, maxLength: 1000, example: 'Клиент просил ткань чуть темнее образца' })
  @IsString({ message: 'Заметка должна быть строкой' })
  @MaxLength(1000, { message: 'Заметка — не длиннее 1000 символов' })
  adminNote: string;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'Имя покупателя', minLength: 2, maxLength: 100, example: 'Мадина Каримова' })
  @IsOptional()
  @Trim()
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя — от 2 до 100 символов' })
  @MaxLength(100, { message: 'Имя — от 2 до 100 символов' })
  customerName?: string;

  @ApiPropertyOptional({ description: 'Телефон', pattern: PHONE_PATTERN.source, example: '+992 93 000 00 02' })
  @IsOptional()
  @Matches(PHONE_PATTERN, { message: PHONE_ERROR })
  phone?: string;

  @ApiPropertyOptional({ description: 'Адрес', minLength: 5, maxLength: 300, example: 'Душанбе, ул. Айни, 25, кв. 4' })
  @IsOptional()
  @Trim()
  @IsString({ message: 'Адрес должен быть строкой' })
  @MinLength(5, { message: 'Адрес — от 5 до 300 символов' })
  @MaxLength(300, { message: 'Адрес — от 5 до 300 символов' })
  address?: string;

  @ApiPropertyOptional({ description: 'Дата доставки, ГГГГ-ММ-ДД. null — убрать дату', type: String, format: 'date', nullable: true, example: '2026-11-25' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: 'Дата доставки — в формате ГГГГ-ММ-ДД' })
  deliveryDate?: string | null;
}
