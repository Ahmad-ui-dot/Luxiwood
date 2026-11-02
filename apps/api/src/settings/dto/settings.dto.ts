import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

const PRICE = { type: 'integer', minimum: 0, maximum: 1000000 } as const;

// Цены конструктора: цена каждого типа мебели в размере по умолчанию
export class ConfiguratorBasePricesDto {
  @ApiProperty({ description: 'Диван', ...PRICE, example: 7900 })
  @IsInt({ message: 'Цена дивана — целое число сомони' })
  @Min(0, { message: 'Цена — от 0 до 1 000 000 сомони' })
  @Max(1000000, { message: 'Цена — от 0 до 1 000 000 сомони' })
  sofa: number;

  @ApiProperty({ description: 'Кресло', ...PRICE, example: 3200 })
  @IsInt({ message: 'Цена кресла — целое число сомони' })
  @Min(0, { message: 'Цена — от 0 до 1 000 000 сомони' })
  @Max(1000000, { message: 'Цена — от 0 до 1 000 000 сомони' })
  armchair: number;

  @ApiProperty({ description: 'Кровать', ...PRICE, example: 6200 })
  @IsInt({ message: 'Цена кровати — целое число сомони' })
  @Min(0, { message: 'Цена — от 0 до 1 000 000 сомони' })
  @Max(1000000, { message: 'Цена — от 0 до 1 000 000 сомони' })
  bed: number;

  @ApiProperty({ description: 'Шкаф', ...PRICE, example: 6900 })
  @IsInt({ message: 'Цена шкафа — целое число сомони' })
  @Min(0, { message: 'Цена — от 0 до 1 000 000 сомони' })
  @Max(1000000, { message: 'Цена — от 0 до 1 000 000 сомони' })
  wardrobe: number;

  @ApiProperty({ description: 'Стол', ...PRICE, example: 2700 })
  @IsInt({ message: 'Цена стола — целое число сомони' })
  @Min(0, { message: 'Цена — от 0 до 1 000 000 сомони' })
  @Max(1000000, { message: 'Цена — от 0 до 1 000 000 сомони' })
  table: number;
}

export class PublicSettingsDto {
  @ApiProperty({ description: 'Доставка по Душанбе, сомони', type: 'integer', example: 150 })
  deliveryPrice: number;

  @ApiProperty({ description: 'От этой суммы товаров доставка бесплатная, сомони', type: 'integer', example: 5000 })
  freeDeliveryFrom: number;

  @ApiProperty({ description: 'Телефон мастерской', example: '+992 93 000 00 00' })
  workshopPhone: string;

  @ApiProperty({ description: 'Часы работы', example: 'Пн–Сб 9:00–19:00' })
  workshopHours: string;
}

export class AdminSettingsDto extends PublicSettingsDto {
  @ApiProperty({ description: 'Конструктор: цена каждого типа в размере по умолчанию, сомони', type: ConfiguratorBasePricesDto })
  configuratorBasePrices: ConfiguratorBasePricesDto;

  @ApiProperty({
    description: 'Конструктор: цена опций, сомони. Ключ — key опции из GET /api/configurator/options',
    type: 'object',
    additionalProperties: { type: 'integer' },
    example: { 'sofa-mechanism': 1200, 'bed-lift': 1500, 'table-extendable': 1400 },
  })
  configuratorOptionPrices: Record<string, number>;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Доставка по Душанбе, сомони', ...PRICE, example: 200 })
  @IsOptional()
  @IsInt({ message: 'Цена доставки — целое число сомони' })
  @Min(0, { message: 'Цена доставки — от 0 до 1 000 000 сомони' })
  @Max(1000000, { message: 'Цена доставки — от 0 до 1 000 000 сомони' })
  deliveryPrice?: number;

  @ApiPropertyOptional({ description: 'Порог бесплатной доставки, сомони', ...PRICE, example: 6000 })
  @IsOptional()
  @IsInt({ message: 'Порог бесплатной доставки — целое число сомони' })
  @Min(0, { message: 'Порог — от 0 до 1 000 000 сомони' })
  @Max(1000000, { message: 'Порог — от 0 до 1 000 000 сомони' })
  freeDeliveryFrom?: number;

  @ApiPropertyOptional({ description: 'Телефон мастерской', minLength: 5, maxLength: 40, example: '+992 93 000 00 00' })
  @IsOptional()
  @IsString({ message: 'Телефон мастерской — строка' })
  @MinLength(5, { message: 'Телефон мастерской — от 5 до 40 символов' })
  @MaxLength(40, { message: 'Телефон мастерской — от 5 до 40 символов' })
  workshopPhone?: string;

  @ApiPropertyOptional({ description: 'Часы работы', minLength: 3, maxLength: 100, example: 'Пн–Сб 9:00–19:00, Вс — выходной' })
  @IsOptional()
  @IsString({ message: 'Часы работы — строка' })
  @MinLength(3, { message: 'Часы работы — от 3 до 100 символов' })
  @MaxLength(100, { message: 'Часы работы — от 3 до 100 символов' })
  workshopHours?: string;

  @ApiPropertyOptional({ description: 'Цены типов мебели в конструкторе. Нужно передать все пять', type: ConfiguratorBasePricesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConfiguratorBasePricesDto)
  configuratorBasePrices?: ConfiguratorBasePricesDto;

  @ApiPropertyOptional({
    description: 'Цены опций конструктора. Можно передать только те, что меняются',
    type: 'object',
    additionalProperties: { type: 'integer' },
    example: { 'sofa-mechanism': 1300 },
  })
  @IsOptional()
  @IsObject({ message: 'configuratorOptionPrices — объект { "key опции": цена }' })
  configuratorOptionPrices?: Record<string, number>;
}
