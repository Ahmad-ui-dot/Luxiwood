import { CONFIGURATOR_KEYS, ConfiguratorKey, ConfiguratorQuote, QUANTITY_LIMITS } from '@luxiwood/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MaterialResponseDto } from '../../materials/dto/material.response.dto';
import { PriceLineDto } from '../../pricing/dto/pricing.response.dto';

// ---------- Запрос ----------

export class ConfiguratorQuoteDto {
  @ApiProperty({ description: 'Тип мебели', enum: CONFIGURATOR_KEYS, example: 'sofa' })
  @IsIn(CONFIGURATOR_KEYS, { message: 'В конструкторе собираются только sofa, armchair, bed, wardrobe и table' })
  type: ConfiguratorKey;

  @ApiProperty({ description: 'Ширина, см. Диапазон своего типа — в GET /api/configurator/options', type: 'integer', example: 230 })
  @IsInt({ message: 'Ширина — целое число сантиметров' })
  widthCm: number;

  @ApiProperty({ description: 'Глубина, см', type: 'integer', example: 95 })
  @IsInt({ message: 'Глубина — целое число сантиметров' })
  depthCm: number;

  @ApiProperty({ description: 'Высота, см', type: 'integer', example: 85 })
  @IsInt({ message: 'Высота — целое число сантиметров' })
  heightCm: number;

  @ApiPropertyOptional({ description: 'ID ткани (FABRIC). Обязательна для дивана, кресла и кровати; у шкафа и стола не указывается', type: 'integer', example: 2 })
  @IsOptional()
  @IsInt({ message: 'ID ткани — целое число' })
  upholsteryMaterialId?: number;

  @ApiPropertyOptional({ description: 'ID цвета обивки (COLOR). Только для мягкой мебели', type: 'integer', example: 5 })
  @IsOptional()
  @IsInt({ message: 'ID цвета — целое число' })
  colorMaterialId?: number;

  @ApiProperty({ description: 'ID породы дерева (WOOD)', type: 'integer', example: 11 })
  @IsInt({ message: 'ID дерева — целое число' })
  woodMaterialId: number;

  @ApiProperty({ description: 'ID покрытия дерева (FINISH)', type: 'integer', example: 16 })
  @IsInt({ message: 'ID покрытия — целое число' })
  finishMaterialId: number;

  @ApiPropertyOptional({ description: 'key опций своего типа из GET /api/configurator/options', type: [String], default: [], example: ['sofa-mechanism'] })
  @IsOptional()
  @IsArray({ message: 'options — массив ключей опций' })
  @ArrayMaxSize(10, { message: 'Не больше 10 опций' })
  @IsString({ each: true, message: 'Каждая опция — строка-ключ' })
  options: string[] = [];

  @ApiPropertyOptional({ description: 'Количество', type: 'integer', minimum: QUANTITY_LIMITS.min, maximum: QUANTITY_LIMITS.max, default: 1, example: 1 })
  @IsOptional()
  @IsInt({ message: 'Количество — целое число' })
  @Min(QUANTITY_LIMITS.min, { message: `Количество — от ${QUANTITY_LIMITS.min} до ${QUANTITY_LIMITS.max}` })
  @Max(QUANTITY_LIMITS.max, { message: `Количество — от ${QUANTITY_LIMITS.min} до ${QUANTITY_LIMITS.max}` })
  quantity: number = 1;
}

// ---------- Ответы ----------

export class SizeRangeDto {
  @ApiProperty({ description: 'Минимум, см', type: 'integer', example: 140 })
  min: number;

  @ApiProperty({ description: 'Максимум, см', type: 'integer', example: 320 })
  max: number;

  @ApiProperty({ description: 'Значение по умолчанию, см', type: 'integer', example: 210 })
  default: number;
}

export class ConfiguratorOptionDto {
  @ApiProperty({ description: 'Ключ опции — передаётся в options', example: 'sofa-mechanism' })
  key: string;

  @ApiProperty({ description: 'Название', example: 'Механизм «еврокнижка»' })
  label: string;

  @ApiProperty({ description: 'Цена, сомони', type: 'integer', example: 1200 })
  price: number;

  @ApiProperty({ description: 'Сколько дней добавляет к сроку', type: 'integer', example: 3 })
  days: number;
}

export class ConfiguratorTypeDto {
  @ApiProperty({ description: 'Тип мебели', enum: CONFIGURATOR_KEYS, example: 'sofa' })
  type: ConfiguratorKey;

  @ApiProperty({ description: 'Название', example: 'Диван' })
  label: string;

  @ApiProperty({ description: 'Ширина, см', type: SizeRangeDto })
  widthCm: SizeRangeDto;

  @ApiProperty({ description: 'Глубина, см', type: SizeRangeDto, example: { min: 80, max: 120, default: 95 } })
  depthCm: SizeRangeDto;

  @ApiProperty({ description: 'Высота, см', type: SizeRangeDto, example: { min: 75, max: 100, default: 85 } })
  heightCm: SizeRangeDto;

  @ApiProperty({ description: 'Цена в размере по умолчанию с материалами без доплат, сомони', type: 'integer', example: 7900 })
  basePrice: number;

  @ApiProperty({ description: 'Срок изготовления без опций, дней', type: 'integer', example: 14 })
  days: number;

  @ApiProperty({ description: 'true — мягкая мебель: выбираются ткань и цвет', example: true })
  usesUpholstery: boolean;

  @ApiProperty({ description: 'Ткани обивки (пусто у шкафа и стола)', type: [MaterialResponseDto] })
  fabrics: MaterialResponseDto[];

  @ApiProperty({ description: 'Цвета обивки (пусто у шкафа и стола)', type: [MaterialResponseDto] })
  colors: MaterialResponseDto[];

  @ApiProperty({ description: 'Породы дерева', type: [MaterialResponseDto] })
  woods: MaterialResponseDto[];

  @ApiProperty({ description: 'Покрытия дерева', type: [MaterialResponseDto] })
  finishes: MaterialResponseDto[];

  @ApiProperty({ description: 'Опции с ценами', type: [ConfiguratorOptionDto] })
  options: ConfiguratorOptionDto[];
}

export class ConfiguratorOptionsDto {
  @ApiProperty({ description: 'Пять типов мебели: sofa, armchair, bed, wardrobe, table', type: [ConfiguratorTypeDto] })
  types: ConfiguratorTypeDto[];
}

export class ConfiguratorQuoteResponseDto implements ConfiguratorQuote {
  @ApiProperty({ description: 'Цена за штуку, сомони, кратно 10', type: 'integer', example: 11170 })
  price: number;

  @ApiProperty({ description: 'Количество', type: 'integer', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Итого = цена × количество', type: 'integer', example: 11170 })
  total: number;

  @ApiProperty({ description: 'Срок изготовления, дней', type: 'integer', example: 17 })
  days: number;

  @ApiProperty({ description: 'Что собрано, одной строкой', example: 'Диван 230×95×85 см · Велюр, Изумруд, Орех, Матовый лак · Механизм «еврокнижка»' })
  summary: string;

  @ApiProperty({
    description: 'Расшифровка цены за штуку',
    type: [PriceLineDto],
    example: [
      { label: 'Диван 230×95×85 см', amount: 8652 },
      { label: 'Ткань: Велюр', amount: 438 },
      { label: 'Цвет: Изумруд', amount: 0 },
      { label: 'Дерево: Орех', amount: 657 },
      { label: 'Отделка: Матовый лак', amount: 219 },
      { label: 'Опция: Механизм «еврокнижка»', amount: 1200 },
      { label: 'Округление до 10 сомони', amount: 4 },
    ],
  })
  breakdown: PriceLineDto[];
}
