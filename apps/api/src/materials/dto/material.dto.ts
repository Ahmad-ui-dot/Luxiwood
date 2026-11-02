import { HEX_PATTERN, MaterialType } from '@luxiwood/shared';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../common/query-transforms';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Тип: FABRIC — ткань обивки, COLOR — цвет обивки, WOOD — порода дерева, FINISH — покрытие дерева',
    enum: MaterialType,
    enumName: 'MaterialType',
    example: 'FABRIC',
  })
  @IsEnum(MaterialType, { message: 'Тип материала: FABRIC, COLOR, WOOD или FINISH' })
  type: MaterialType;

  @ApiProperty({ description: 'Название', minLength: 2, maxLength: 60, example: 'Микровелюр' })
  @Trim()
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(2, { message: 'Название — от 2 до 60 символов' })
  @MaxLength(60, { message: 'Название — от 2 до 60 символов' })
  name: string;

  @ApiProperty({ description: 'Цвет для 3D и образца, #RRGGBB', pattern: HEX_PATTERN.source, example: '#EDE6DA' })
  @Matches(HEX_PATTERN, { message: 'Цвет — в формате #RRGGBB, например #EDE6DA' })
  hex: string;

  @ApiPropertyOptional({
    description: 'Доплата, целые сомони. В конструкторе растёт вместе с размером мебели',
    type: 'integer',
    minimum: -100000,
    maximum: 100000,
    default: 0,
    example: 300,
  })
  @IsOptional()
  @IsInt({ message: 'Доплата должна быть целым числом сомони' })
  @Min(-100000, { message: 'Доплата — от −100 000 до 100 000 сомони' })
  @Max(100000, { message: 'Доплата — от −100 000 до 100 000 сомони' })
  priceDelta?: number;

  @ApiPropertyOptional({ description: 'Показывать покупателям. false — материал отключён и не принимается в заказах', default: true, example: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive — true или false' })
  isActive?: boolean;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
