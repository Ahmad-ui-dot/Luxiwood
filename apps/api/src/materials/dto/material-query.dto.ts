import { MaterialType } from '@luxiwood/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class MaterialQueryDto {
  @ApiPropertyOptional({
    description: 'Тип материала: FABRIC — ткань, COLOR — цвет обивки, WOOD — дерево, FINISH — покрытие. Без него — все',
    enum: MaterialType,
    enumName: 'MaterialType',
    example: 'FABRIC',
  })
  @IsOptional()
  @IsEnum(MaterialType, { message: 'Тип материала: FABRIC, COLOR, WOOD или FINISH' })
  type?: MaterialType;
}
