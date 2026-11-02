import { QUANTITY_LIMITS } from '@luxiwood/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QuoteDto {
  @ApiProperty({ description: 'ID товара', type: 'integer', minimum: 1, example: 1 })
  @IsInt({ message: 'ID товара — целое число' })
  @Min(1, { message: 'ID товара — целое число' })
  productId: number;

  @ApiProperty({ description: 'ID основного материала из mainMaterials товара', type: 'integer', minimum: 1, example: 1 })
  @IsInt({ message: 'ID материала — целое число' })
  @Min(1, { message: 'ID материала — целое число' })
  mainMaterialId: number;

  @ApiPropertyOptional({ description: 'ID цвета из colorMaterials. Не указан — цвет по умолчанию', type: 'integer', minimum: 1, example: 6 })
  @IsOptional()
  @IsInt({ message: 'ID цвета — целое число' })
  @Min(1, { message: 'ID цвета — целое число' })
  colorMaterialId?: number;

  @ApiPropertyOptional({ description: 'ID дерева из woodMaterials. Не указан — дерево по умолчанию', type: 'integer', minimum: 1, example: 11 })
  @IsOptional()
  @IsInt({ message: 'ID дерева — целое число' })
  @Min(1, { message: 'ID дерева — целое число' })
  woodMaterialId?: number;

  @ApiPropertyOptional({ description: 'ID размера из sizes. Не указан — размер по умолчанию', type: 'integer', minimum: 1, example: 2 })
  @IsOptional()
  @IsInt({ message: 'ID размера — целое число' })
  @Min(1, { message: 'ID размера — целое число' })
  sizeId?: number;

  @ApiProperty({ description: 'Количество', type: 'integer', minimum: QUANTITY_LIMITS.min, maximum: QUANTITY_LIMITS.max, example: 1 })
  @IsInt({ message: 'Количество — целое число' })
  @Min(QUANTITY_LIMITS.min, { message: `Количество — от ${QUANTITY_LIMITS.min} до ${QUANTITY_LIMITS.max}` })
  @Max(QUANTITY_LIMITS.max, { message: `Количество — от ${QUANTITY_LIMITS.min} до ${QUANTITY_LIMITS.max}` })
  quantity: number;
}

export class FitDto {
  @ApiProperty({ description: 'ID товара', type: 'integer', minimum: 1, example: 1 })
  @IsInt({ message: 'ID товара — целое число' })
  @Min(1, { message: 'ID товара — целое число' })
  productId: number;

  @ApiPropertyOptional({ description: 'ID размера. Не указан — размер по умолчанию', type: 'integer', minimum: 1, example: 2 })
  @IsOptional()
  @IsInt({ message: 'ID размера — целое число' })
  @Min(1, { message: 'ID размера — целое число' })
  sizeId?: number;

  @ApiProperty({ description: 'Ширина ниши или стены у покупателя, см', type: 'integer', minimum: 1, maximum: 2000, example: 230 })
  @IsInt({ message: 'Ширина ниши — целое число сантиметров' })
  @Min(1, { message: 'Ширина ниши — от 1 до 2000 см' })
  @Max(2000, { message: 'Ширина ниши — от 1 до 2000 см' })
  nicheWidthCm: number;
}
