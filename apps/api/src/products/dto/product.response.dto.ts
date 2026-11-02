import {
  Badge,
  MaterialRole,
  MaterialType,
  Model3dKey,
  ProductDetails,
  ProductKind,
  ProductListItem,
  ProductSize,
  Room,
} from '@luxiwood/shared';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from '../../categories/dto/category.response.dto';
import { MaterialResponseDto } from '../../materials/dto/material.response.dto';

// Карточка товара в каталоге
export class ProductListItemDto implements ProductListItem {
  @ApiProperty({ description: 'ID товара', type: 'integer', example: 1 })
  id: number;

  @ApiProperty({ description: 'Адрес товара в URL (латиница)', example: 'divan-orom' })
  slug: string;

  @ApiProperty({ description: 'Артикул', example: 'LX-101' })
  sku: string;

  @ApiProperty({ description: 'Название', example: 'Диван трёхместный «Ором»' })
  name: string;

  @ApiProperty({ description: 'Цена, целые сомони: материал и размер по умолчанию, без доплат', type: 'integer', example: 8900 })
  basePrice: number;

  @ApiProperty({ description: 'Цена до скидки, сомони. null — скидки нет', type: 'integer', nullable: true, example: 9900 })
  oldPrice: number | null;

  @ApiProperty({
    description: 'Основной материал: FABRIC — ткань (мягкая мебель), WOOD — дерево (корпусная)',
    enum: ProductKind,
    enumName: 'ProductKind',
    example: 'FABRIC',
  })
  kind: ProductKind;

  @ApiProperty({ description: 'Комната', enum: Room, enumName: 'Room', example: 'LIVING' })
  room: Room;

  @ApiProperty({ description: 'Значок: NONE — нет, HIT — хит продаж, NEW — новинка', enum: Badge, enumName: 'Badge', example: 'HIT' })
  badge: Badge;

  @ApiProperty({ description: 'Ширина в размере по умолчанию, см', type: 'integer', example: 210 })
  widthCm: number;

  @ApiProperty({ description: 'Тип мебели и встроенная 3D-модель', enum: Model3dKey, enumName: 'Model3dKey', example: 'sofa' })
  model3dKey: Model3dKey;

  @ApiProperty({ description: 'Ссылки на фото. Может быть пустым', type: [String], example: ['/uploads/images/3f2c9a.jpg'] })
  images: string[];

  @ApiProperty({ description: 'Срок изготовления, дней', type: 'integer', example: 14 })
  productionDays: number;

  @ApiProperty({ description: 'Средняя оценка по одобренным отзывам, 0 — отзывов нет', example: 4.5 })
  ratingAvg: number;

  @ApiProperty({ description: 'Число одобренных отзывов', type: 'integer', example: 12 })
  reviewsCount: number;

  @ApiProperty({ description: 'Категория', type: CategoryResponseDto })
  category: CategoryResponseDto;
}

export class ProductSizeDto implements ProductSize {
  @ApiProperty({ description: 'ID размера', type: 'integer', example: 2 })
  id: number;

  @ApiProperty({ description: 'Подпись размера для покупателя', example: '210 см' })
  label: string;

  @ApiProperty({ description: 'Ширина, см', type: 'integer', example: 210 })
  widthCm: number;

  @ApiProperty({ description: 'Высота, см', type: 'integer', example: 85 })
  heightCm: number;

  @ApiProperty({ description: 'Глубина, см', type: 'integer', example: 95 })
  depthCm: number;

  @ApiProperty({ description: 'Доплата к цене, сомони. Меньший размер — отрицательное число', type: 'integer', example: 0 })
  priceDelta: number;

  @ApiProperty({ description: 'Выбран ли этот размер по умолчанию', example: true })
  isDefault: boolean;
}

// Что выбрано на странице товара сразу после открытия
export class ProductDefaultsDto {
  @ApiProperty({ description: 'ID основного материала (ткани или дерева)', type: 'integer', nullable: true, example: 1 })
  mainMaterialId: number | null;

  @ApiProperty({ description: 'ID цвета обивки. null — у товара нет выбора цвета', type: 'integer', nullable: true, example: 6 })
  colorMaterialId: number | null;

  @ApiProperty({ description: 'ID дерева ножек и каркаса. null — нет выбора дерева', type: 'integer', nullable: true, example: 10 })
  woodMaterialId: number | null;

  @ApiProperty({ description: 'ID размера. null — размеров нет', type: 'integer', nullable: true, example: 2 })
  sizeId: number | null;
}

// Страница товара: всё из карточки + описание, варианты материалов и размеров
export class ProductDetailsDto extends ProductListItemDto implements ProductDetails {
  @ApiProperty({ description: 'Описание', example: 'Трёхместный диван с мягкими подушками и деревянными ножками.' })
  description: string;

  @ApiProperty({ description: 'Из чего сделан товар', example: 'Каркас: массив сосны · Обивка: ткань на выбор · Ножки: массив дерева' })
  materialsText: string;

  @ApiProperty({ description: 'Своя 3D-модель .glb. null — показывается встроенная модель model3dKey', type: String, nullable: true, example: null })
  modelUrl: string | null;

  @ApiProperty({ description: 'Основной материал на выбор: ткани (kind = FABRIC) или дерево (kind = WOOD)', type: [MaterialResponseDto] })
  mainMaterials: MaterialResponseDto[];

  @ApiProperty({ description: 'Цвета обивки. Пусто у корпусной мебели', type: [MaterialResponseDto] })
  colorMaterials: MaterialResponseDto[];

  @ApiProperty({ description: 'Дерево ножек и каркаса. Пусто, если выбора нет', type: [MaterialResponseDto] })
  woodMaterials: MaterialResponseDto[];

  @ApiProperty({ description: 'Размеры, от узкого к широкому', type: [ProductSizeDto] })
  sizes: ProductSizeDto[];

  @ApiProperty({ description: 'Варианты по умолчанию: отмеченные isDefault, а если отметки нет — первые в списке', type: ProductDefaultsDto })
  defaults: ProductDefaultsDto;
}

// ---------- Данные для фильтров каталога ----------

export class RangeDto {
  @ApiProperty({ description: 'Минимум', type: 'integer', example: 1800 })
  min: number;

  @ApiProperty({ description: 'Максимум', type: 'integer', example: 12400 })
  max: number;
}

export class ColorFilterDto {
  @ApiProperty({ description: 'ID материала — передаётся в ?color=', type: 'integer', example: 5 })
  id: number;

  @ApiProperty({ description: 'Название', example: 'Изумруд' })
  name: string;

  @ApiProperty({ description: 'Цвет кружка, #RRGGBB', example: '#1F6B55' })
  hex: string;

  @ApiProperty({ description: 'COLOR — цвет обивки, WOOD — порода дерева', enum: MaterialType, enumName: 'MaterialType', example: 'COLOR' })
  type: MaterialType;

  @ApiProperty({ description: 'Сколько товаров бывает в этом цвете', type: 'integer', example: 14 })
  count: number;
}

export class RoomFilterDto {
  @ApiProperty({ description: 'Значение для ?room=', enum: Room, enumName: 'Room', example: 'LIVING' })
  value: Room;

  @ApiProperty({ description: 'Название', example: 'Гостиная' })
  label: string;

  @ApiProperty({ description: 'Сколько товаров', type: 'integer', example: 6 })
  count: number;
}

export class TypeFilterDto {
  @ApiProperty({ description: 'Значение для ?type=', enum: Model3dKey, enumName: 'Model3dKey', example: 'sofa' })
  value: Model3dKey;

  @ApiProperty({ description: 'Название', example: 'Диван' })
  label: string;

  @ApiProperty({ description: 'Сколько товаров', type: 'integer', example: 5 })
  count: number;
}

export class ProductFiltersDto {
  @ApiProperty({ description: 'Сколько всего активных товаров', type: 'integer', example: 24 })
  total: number;

  @ApiProperty({ description: 'Цена, сомони', type: RangeDto })
  price: RangeDto;

  @ApiProperty({ description: 'Ширина, см', type: RangeDto, example: { min: 55, max: 280 } })
  width: RangeDto;

  @ApiProperty({ description: 'Срок изготовления, дней', type: RangeDto, example: { min: 7, max: 18 } })
  days: RangeDto;

  @ApiProperty({ description: 'Цвета обивки и породы дерева', type: [ColorFilterDto] })
  colors: ColorFilterDto[];

  @ApiProperty({ description: 'Комнаты, где есть товары', type: [RoomFilterDto] })
  rooms: RoomFilterDto[];

  @ApiProperty({ description: 'Типы мебели, которые есть в каталоге', type: [TypeFilterDto] })
  types: TypeFilterDto[];

  @ApiProperty({ description: 'Сколько товаров со скидкой', type: 'integer', example: 6 })
  saleCount: number;
}

// ---------- Админка ----------

export class AdminProductListItemDto extends ProductListItemDto {
  @ApiProperty({ description: 'Виден ли покупателям', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Когда создан', type: String, format: 'date-time', example: '2026-10-30T09:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Когда изменён', type: String, format: 'date-time', example: '2026-10-30T09:00:00.000Z' })
  updatedAt: string;
}

export class ProductMaterialLinkDto {
  @ApiProperty({ description: 'ID материала', type: 'integer', example: 1 })
  materialId: number;

  @ApiProperty({
    description: 'MAIN — основной материал, COLOR — цвет обивки, WOOD — дерево ножек и каркаса',
    enum: MaterialRole,
    enumName: 'MaterialRole',
    example: 'MAIN',
  })
  role: MaterialRole;

  @ApiProperty({ description: 'Выбран по умолчанию', example: true })
  isDefault: boolean;

  @ApiProperty({ description: 'Материал', type: MaterialResponseDto })
  material: MaterialResponseDto;
}

export class AdminProductDto extends AdminProductListItemDto {
  @ApiProperty({ description: 'ID категории', type: 'integer', example: 1 })
  categoryId: number;

  @ApiProperty({ description: 'Описание', example: 'Трёхместный диван с мягкими подушками и деревянными ножками.' })
  description: string;

  @ApiProperty({ description: 'Из чего сделан товар', example: 'Каркас: массив сосны · Обивка: ткань на выбор' })
  materialsText: string;

  @ApiProperty({ description: 'Своя 3D-модель .glb', type: String, nullable: true, example: null })
  modelUrl: string | null;

  @ApiProperty({ description: 'Разрешённые материалы, включая отключённые', type: [ProductMaterialLinkDto] })
  materials: ProductMaterialLinkDto[];

  @ApiProperty({ description: 'Размеры', type: [ProductSizeDto] })
  sizes: ProductSizeDto[];
}

export class DeleteProductResultDto {
  @ApiProperty({ description: 'true — товар удалён из базы', example: false })
  deleted: boolean;

  @ApiProperty({ description: 'true — товар есть в заказах, поэтому он не удалён, а скрыт (isActive = false)', example: true })
  hidden: boolean;

  @ApiProperty({ description: 'Что произошло, по-русски', example: 'Товар есть в заказах (2), поэтому он не удалён, а скрыт из каталога' })
  message: string;
}
