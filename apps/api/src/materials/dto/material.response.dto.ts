import { Material, MaterialType } from '@luxiwood/shared';
import { ApiProperty } from '@nestjs/swagger';

export class MaterialResponseDto implements Material {
  @ApiProperty({ description: 'ID материала', type: 'integer', example: 1 })
  id: number;

  @ApiProperty({
    description: 'Тип: FABRIC — ткань обивки, COLOR — цвет обивки, WOOD — порода дерева, FINISH — покрытие дерева',
    enum: MaterialType,
    enumName: 'MaterialType',
    example: 'FABRIC',
  })
  type: MaterialType;

  @ApiProperty({ description: 'Название', example: 'Букле' })
  name: string;

  @ApiProperty({ description: 'Цвет для 3D-модели и образца, #RRGGBB', example: '#EDE6DA' })
  hex: string;

  @ApiProperty({
    description: 'Доплата за материал, целые сомони. Может быть 0. В конструкторе растёт вместе с размером мебели',
    type: 'integer',
    example: 0,
  })
  priceDelta: number;

  @ApiProperty({ description: 'Показывается ли покупателям. Публичный API отдаёт только true', example: true })
  isActive: boolean;
}

export class AdminMaterialDto extends MaterialResponseDto {
  @ApiProperty({ description: 'У скольких товаров материал разрешён', type: 'integer', example: 10 })
  productsCount: number;
}
