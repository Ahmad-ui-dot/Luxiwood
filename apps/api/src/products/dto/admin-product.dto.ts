import { Badge, MaterialRole, Model3dKey, ProductKind, Room, SLUG_PATTERN } from '@luxiwood/shared';
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
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
import { PaginationQueryDto } from '../../common/pagination';
import { ToBoolean, Trim } from '../../common/query-transforms';

// ---------- Размер ----------

export class CreateProductSizeDto {
  @ApiProperty({ description: 'Подпись размера для покупателя', minLength: 1, maxLength: 40, example: '210 см' })
  @Trim()
  @IsString({ message: 'Подпись размера должна быть строкой' })
  @MinLength(1, { message: 'Укажите подпись размера, например «210 см»' })
  @MaxLength(40, { message: 'Подпись размера — не длиннее 40 символов' })
  label: string;

  @ApiProperty({ description: 'Ширина, см', type: 'integer', minimum: 10, maximum: 500, example: 210 })
  @IsInt({ message: 'Ширина — целое число сантиметров' })
  @Min(10, { message: 'Ширина — от 10 до 500 см' })
  @Max(500, { message: 'Ширина — от 10 до 500 см' })
  widthCm: number;

  @ApiProperty({ description: 'Высота, см', type: 'integer', minimum: 10, maximum: 500, example: 85 })
  @IsInt({ message: 'Высота — целое число сантиметров' })
  @Min(10, { message: 'Высота — от 10 до 500 см' })
  @Max(500, { message: 'Высота — от 10 до 500 см' })
  heightCm: number;

  @ApiProperty({ description: 'Глубина, см', type: 'integer', minimum: 10, maximum: 500, example: 95 })
  @IsInt({ message: 'Глубина — целое число сантиметров' })
  @Min(10, { message: 'Глубина — от 10 до 500 см' })
  @Max(500, { message: 'Глубина — от 10 до 500 см' })
  depthCm: number;

  @ApiPropertyOptional({ description: 'Доплата к цене, сомони. Меньший размер — отрицательное число', type: 'integer', default: 0, example: 0 })
  @IsOptional()
  @IsInt({ message: 'Доплата за размер — целое число сомони' })
  @Min(-100000, { message: 'Доплата — от −100 000 до 100 000 сомони' })
  @Max(100000, { message: 'Доплата — от −100 000 до 100 000 сомони' })
  priceDelta?: number;

  @ApiPropertyOptional({ description: 'Размер по умолчанию. У товара он один: отметка снимается с остальных', default: false, example: true })
  @IsOptional()
  @IsBoolean({ message: 'isDefault — true или false' })
  isDefault?: boolean;
}

export class UpdateProductSizeDto extends PartialType(CreateProductSizeDto) {}

// ---------- Привязка материала ----------

export class ProductMaterialInputDto {
  @ApiProperty({ description: 'ID материала', type: 'integer', minimum: 1, example: 1 })
  @IsInt({ message: 'ID материала — целое число' })
  @Min(1, { message: 'ID материала — целое число' })
  materialId: number;

  @ApiProperty({
    description:
      'MAIN — основной материал (ткань FABRIC у мягкой мебели, дерево WOOD у корпусной), COLOR — цвет обивки (материал COLOR), WOOD — дерево ножек (материал WOOD)',
    enum: MaterialRole,
    enumName: 'MaterialRole',
    example: 'MAIN',
  })
  @IsEnum(MaterialRole, { message: 'Роль материала: MAIN, COLOR или WOOD' })
  role: MaterialRole;

  @ApiPropertyOptional({ description: 'Выбран по умолчанию. В каждой роли — не больше одного', default: false, example: true })
  @IsOptional()
  @IsBoolean({ message: 'isDefault — true или false' })
  isDefault?: boolean;
}

export class SetProductMaterialsDto {
  @ApiProperty({ description: 'Полный список разрешённых материалов. Старый список заменяется целиком', type: [ProductMaterialInputDto] })
  @IsArray({ message: 'materials — массив' })
  @ArrayMaxSize(100, { message: 'Не больше 100 материалов' })
  @ValidateNested({ each: true })
  @Type(() => ProductMaterialInputDto)
  materials: ProductMaterialInputDto[];
}

// ---------- Товар ----------

export class CreateProductDto {
  @ApiProperty({ description: 'Адрес в URL: латиница, цифры, дефисы. Уникальный', pattern: SLUG_PATTERN.source, maxLength: 80, example: 'divan-tryohmestnyj' })
  @Trim()
  @Matches(SLUG_PATTERN, { message: 'slug: только латиница в нижнем регистре, цифры и дефисы, например divan-orom' })
  @MaxLength(80, { message: 'slug — не длиннее 80 символов' })
  slug: string;

  @ApiProperty({ description: 'Артикул. Уникальный', minLength: 2, maxLength: 30, example: 'LX-106' })
  @Trim()
  @IsString({ message: 'Артикул должен быть строкой' })
  @MinLength(2, { message: 'Артикул — от 2 до 30 символов' })
  @MaxLength(30, { message: 'Артикул — от 2 до 30 символов' })
  sku: string;

  @ApiProperty({ description: 'Название', minLength: 2, maxLength: 120, example: 'Диван трёхместный' })
  @Trim()
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(2, { message: 'Название — от 2 до 120 символов' })
  @MaxLength(120, { message: 'Название — от 2 до 120 символов' })
  name: string;

  @ApiPropertyOptional({ description: 'Описание', maxLength: 3000, example: 'Трёхместный диван с мягкими подушками.' })
  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(3000, { message: 'Описание — не длиннее 3000 символов' })
  description?: string;

  @ApiProperty({ description: 'ID категории из GET /api/admin/categories', type: 'integer', minimum: 1, example: 1 })
  @IsInt({ message: 'ID категории — целое число' })
  @Min(1, { message: 'ID категории — целое число' })
  categoryId: number;

  @ApiProperty({ description: 'Цена, целые сомони', type: 'integer', minimum: 0, maximum: 1000000, example: 8900 })
  @IsInt({ message: 'Цена — целое число сомони' })
  @Min(0, { message: 'Цена — от 0 до 1 000 000 сомони' })
  @Max(1000000, { message: 'Цена — от 0 до 1 000 000 сомони' })
  basePrice: number;

  @ApiPropertyOptional({ description: 'Цена до скидки, больше basePrice. null — убрать скидку', type: 'integer', nullable: true, example: 9900 })
  @IsOptional()
  @IsInt({ message: 'Старая цена — целое число сомони' })
  @Min(1, { message: 'Старая цена — больше 0' })
  @Max(1000000, { message: 'Старая цена — до 1 000 000 сомони' })
  oldPrice?: number | null;

  @ApiProperty({ description: 'Основной материал: FABRIC — ткань, WOOD — дерево', enum: ProductKind, enumName: 'ProductKind', example: 'FABRIC' })
  @IsEnum(ProductKind, { message: 'kind: FABRIC или WOOD' })
  kind: ProductKind;

  @ApiProperty({ description: 'Комната', enum: Room, enumName: 'Room', example: 'LIVING' })
  @IsEnum(Room, { message: 'Комната: LIVING, BEDROOM, DINING, OFFICE, KIDS или HALLWAY' })
  room: Room;

  @ApiPropertyOptional({ description: 'Значок на карточке', enum: Badge, enumName: 'Badge', default: 'NONE', example: 'NEW' })
  @IsOptional()
  @IsEnum(Badge, { message: 'Значок: NONE, HIT или NEW' })
  badge?: Badge;

  @ApiPropertyOptional({
    description: 'Ширина для фильтра «встанет в нишу», см. Если не указать — берётся из размера по умолчанию',
    type: 'integer',
    minimum: 10,
    maximum: 500,
    example: 210,
  })
  @IsOptional()
  @IsInt({ message: 'Ширина — целое число сантиметров' })
  @Min(10, { message: 'Ширина — от 10 до 500 см' })
  @Max(500, { message: 'Ширина — от 10 до 500 см' })
  widthCm?: number;

  @ApiPropertyOptional({ description: 'Из чего сделан товар', maxLength: 500, example: 'Каркас: массив сосны · Обивка: ткань на выбор' })
  @IsOptional()
  @IsString({ message: 'Состав должен быть строкой' })
  @MaxLength(500, { message: 'Состав — не длиннее 500 символов' })
  materialsText?: string;

  @ApiProperty({ description: 'Срок изготовления, дней', type: 'integer', minimum: 1, maximum: 120, example: 14 })
  @IsInt({ message: 'Срок — целое число дней' })
  @Min(1, { message: 'Срок — от 1 до 120 дней' })
  @Max(120, { message: 'Срок — от 1 до 120 дней' })
  productionDays: number;

  @ApiProperty({ description: 'Тип мебели и встроенная 3D-модель', enum: Model3dKey, enumName: 'Model3dKey', example: 'sofa' })
  @IsEnum(Model3dKey, { message: 'Тип мебели: sofa, armchair, bed, wardrobe, table, chair, dresser, nightstand, shelf, pouf или bench' })
  model3dKey: Model3dKey;

  @ApiPropertyOptional({ description: 'Ссылка на свою 3D-модель .glb из POST /api/admin/uploads/model. null — убрать', type: String, nullable: true, maxLength: 500, example: '/uploads/models/5d1e0a.glb' })
  @IsOptional()
  @IsString({ message: 'Ссылка на модель должна быть строкой' })
  @MaxLength(500, { message: 'Ссылка — не длиннее 500 символов' })
  modelUrl?: string | null;

  @ApiPropertyOptional({ description: 'Ссылки на фото из POST /api/admin/uploads/image, до 20', type: [String], example: ['/uploads/images/3f2c9a.jpg'] })
  @IsOptional()
  @IsArray({ message: 'images — массив ссылок' })
  @ArrayMaxSize(20, { message: 'Не больше 20 фото' })
  @IsString({ each: true, message: 'Каждое фото — строка-ссылка' })
  @MaxLength(500, { each: true, message: 'Ссылка — не длиннее 500 символов' })
  images?: string[];

  @ApiPropertyOptional({ description: 'Показывать покупателям', default: true, example: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive — true или false' })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Разрешённые материалы. Можно задать позже: PUT /api/admin/products/:id/materials', type: [ProductMaterialInputDto] })
  @IsOptional()
  @IsArray({ message: 'materials — массив' })
  @ArrayMaxSize(100, { message: 'Не больше 100 материалов' })
  @ValidateNested({ each: true })
  @Type(() => ProductMaterialInputDto)
  materials?: ProductMaterialInputDto[];

  @ApiPropertyOptional({ description: 'Размеры. Можно добавить позже: POST /api/admin/products/:id/sizes', type: [CreateProductSizeDto] })
  @IsOptional()
  @IsArray({ message: 'sizes — массив' })
  @ArrayMaxSize(20, { message: 'Не больше 20 размеров' })
  @ValidateNested({ each: true })
  @Type(() => CreateProductSizeDto)
  sizes?: CreateProductSizeDto[];
}

export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ['materials', 'sizes'] as const)) {}

// ---------- Фильтры списка в админке ----------

export class AdminProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Поиск по части названия или артикула', maxLength: 100, example: 'LX-1' })
  @IsOptional()
  @IsString({ message: 'Поиск должен быть строкой' })
  @MaxLength(100, { message: 'Поиск — не длиннее 100 символов' })
  search?: string;

  @ApiPropertyOptional({ description: 'ID категории', type: 'integer', minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID категории — целое число' })
  @Min(1, { message: 'ID категории — целое число' })
  categoryId?: number;

  @ApiPropertyOptional({ description: 'true — только видимые, false — только скрытые. Без него — все', type: Boolean, example: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({ message: 'isActive — true или false' })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Комната', enum: Room, enumName: 'Room', example: 'LIVING' })
  @IsOptional()
  @IsEnum(Room, { message: 'Комната: LIVING, BEDROOM, DINING, OFFICE, KIDS или HALLWAY' })
  room?: Room;

  @ApiPropertyOptional({ description: 'Тип мебели', enum: Model3dKey, enumName: 'Model3dKey', example: 'sofa' })
  @IsOptional()
  @IsEnum(Model3dKey, { message: 'Тип мебели: sofa, armchair, bed, wardrobe, table, chair, dresser, nightstand, shelf, pouf или bench' })
  type?: Model3dKey;

  @ApiPropertyOptional({ description: 'Значок', enum: Badge, enumName: 'Badge', example: 'HIT' })
  @IsOptional()
  @IsEnum(Badge, { message: 'Значок: NONE, HIT или NEW' })
  badge?: Badge;
}
