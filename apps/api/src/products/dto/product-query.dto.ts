import { Badge, Model3dKey, Room } from '@luxiwood/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';
import { ToBoolean } from '../../common/query-transforms';

export const PRODUCT_SORTS = ['popular', 'price_asc', 'price_desc', 'rating', 'new'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'slug категории из GET /api/categories', example: 'divany' })
  @IsOptional()
  @IsString({ message: 'Категория должна быть строкой' })
  category?: string;

  @ApiPropertyOptional({ description: 'Комната', enum: Room, enumName: 'Room', example: 'LIVING' })
  @IsOptional()
  @IsEnum(Room, { message: 'Комната: LIVING, BEDROOM, DINING, OFFICE, KIDS или HALLWAY' })
  room?: Room;

  @ApiPropertyOptional({ description: 'Тип мебели (он же ключ 3D-модели)', enum: Model3dKey, enumName: 'Model3dKey', example: 'sofa' })
  @IsOptional()
  @IsEnum(Model3dKey, { message: 'Тип мебели: sofa, armchair, bed, wardrobe, table, chair, dresser, nightstand, shelf, pouf или bench' })
  type?: Model3dKey;

  @ApiPropertyOptional({ description: 'Поиск по части названия или артикула, без учёта регистра', maxLength: 100, example: 'диван' })
  @IsOptional()
  @IsString({ message: 'Поиск должен быть строкой' })
  @MaxLength(100, { message: 'Поиск — не длиннее 100 символов' })
  search?: string;

  @ApiPropertyOptional({ description: 'Цена от, целые сомони (включительно)', type: 'integer', minimum: 0, example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Цена «от» должна быть целым числом' })
  @Min(0, { message: 'Цена «от» не может быть меньше 0' })
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Цена до, целые сомони (включительно)', type: 'integer', minimum: 0, example: 9000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Цена «до» должна быть целым числом' })
  @Min(0, { message: 'Цена «до» не может быть меньше 0' })
  maxPrice?: number;

  @ApiPropertyOptional({ description: '«Встанет в нишу»: ширина товара не больше, см', type: 'integer', minimum: 1, example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Ширина ниши должна быть целым числом сантиметров' })
  @Min(1, { message: 'Ширина ниши — от 1 см' })
  maxWidth?: number;

  @ApiPropertyOptional({ description: 'ID цвета или породы дерева из GET /api/products/filters (colors)', type: 'integer', minimum: 1, example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Цвет — это ID материала, целое число' })
  @Min(1, { message: 'Цвет — это ID материала, целое число' })
  color?: number;

  @ApiPropertyOptional({ description: 'Срок изготовления не больше, дней', type: 'integer', minimum: 1, example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Срок должен быть целым числом дней' })
  @Min(1, { message: 'Срок — от 1 дня' })
  maxDays?: number;

  @ApiPropertyOptional({ description: 'Только с этим значком: HIT — хит продаж, NEW — новинка', enum: ['HIT', 'NEW'], enumName: 'BadgeFilter', example: 'HIT' })
  @IsOptional()
  @IsIn(['HIT', 'NEW'], { message: 'Значок: HIT или NEW' })
  badge?: Exclude<Badge, 'NONE'>;

  @ApiPropertyOptional({ description: 'true — только товары со скидкой (есть oldPrice)', type: Boolean, example: true })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({ message: 'sale — true или false' })
  sale?: boolean;

  @ApiPropertyOptional({
    description:
      'Сортировка: popular — больше отзывов и выше оценка, price_asc — сначала дешёвые, price_desc — сначала дорогие, ' +
      'rating — выше оценка, new — сначала новые',
    enum: PRODUCT_SORTS,
    enumName: 'ProductSort',
    default: 'popular',
    example: 'price_asc',
  })
  @IsOptional()
  @IsIn(PRODUCT_SORTS, { message: 'Сортировка: popular, price_asc, price_desc, rating или new' })
  sort: ProductSort = 'popular';
}
