import { MODEL3D_LABELS, ROOM_LABELS } from '@luxiwood/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pageArgs, paginate } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto, ProductSort } from './dto/product-query.dto';

const SORT_ORDER: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  popular: [{ reviewsCount: 'desc' }, { ratingAvg: 'desc' }, { id: 'asc' }],
  price_asc: [{ basePrice: 'asc' }, { id: 'asc' }],
  price_desc: [{ basePrice: 'desc' }, { id: 'asc' }],
  rating: [{ ratingAvg: 'desc' }, { reviewsCount: 'desc' }, { id: 'asc' }],
  new: [{ createdAt: 'desc' }, { id: 'desc' }],
};

// Поля товара для карточки в каталоге
export const LIST_SELECT = {
  id: true,
  slug: true,
  sku: true,
  name: true,
  basePrice: true,
  oldPrice: true,
  kind: true,
  room: true,
  badge: true,
  widthCm: true,
  model3dKey: true,
  images: true,
  productionDays: true,
  ratingAvg: true,
  reviewsCount: true,
  category: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      category: query.category ? { slug: query.category } : undefined,
      room: query.room,
      model3dKey: query.type,
      basePrice: { gte: query.minPrice, lte: query.maxPrice },
      widthCm: query.maxWidth ? { lte: query.maxWidth } : undefined,
      productionDays: query.maxDays ? { lte: query.maxDays } : undefined,
      badge: query.badge,
      oldPrice: query.sale ? { not: null } : undefined,
      materials: query.color ? { some: { materialId: query.color } } : undefined,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { sku: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, select: LIST_SELECT, orderBy: SORT_ORDER[query.sort], ...pageArgs(query) }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  // Всё, что нужно сайту, чтобы нарисовать фильтры: диапазоны, цвета, комнаты, типы с количеством
  async filters() {
    const where = { isActive: true };
    const [stats, rooms, types, saleCount, links] = await Promise.all([
      this.prisma.product.aggregate({
        where,
        _count: { _all: true },
        _min: { basePrice: true, widthCm: true, productionDays: true },
        _max: { basePrice: true, widthCm: true, productionDays: true },
      }),
      this.prisma.product.groupBy({ by: ['room'], where, _count: { _all: true }, orderBy: { room: 'asc' } }),
      this.prisma.product.groupBy({ by: ['model3dKey'], where, _count: { _all: true }, orderBy: { model3dKey: 'asc' } }),
      this.prisma.product.count({ where: { ...where, oldPrice: { not: null } } }),
      this.prisma.productMaterial.findMany({
        where: { product: where, material: { isActive: true, type: { in: ['COLOR', 'WOOD'] } } },
        select: { productId: true, material: true },
      }),
    ]);

    // Сколько разных товаров бывает в каждом цвете
    const colors = new Map<number, { id: number; name: string; hex: string; type: 'COLOR' | 'WOOD'; products: Set<number> }>();
    for (const { productId, material } of links) {
      const color = colors.get(material.id) ?? { ...pick(material), type: material.type as 'COLOR' | 'WOOD', products: new Set() };
      color.products.add(productId);
      colors.set(material.id, color);
    }

    return {
      total: stats._count._all,
      price: { min: stats._min.basePrice ?? 0, max: stats._max.basePrice ?? 0 },
      width: { min: stats._min.widthCm ?? 0, max: stats._max.widthCm ?? 0 },
      days: { min: stats._min.productionDays ?? 0, max: stats._max.productionDays ?? 0 },
      colors: [...colors.values()]
        .sort((a, b) => a.type.localeCompare(b.type) || a.id - b.id)
        .map(({ products, ...color }) => ({ ...color, count: products.size })),
      rooms: rooms.map((row) => ({ value: row.room, label: ROOM_LABELS[row.room], count: row._count._all })),
      types: types.map((row) => ({ value: row.model3dKey, label: MODEL3D_LABELS[row.model3dKey], count: row._count._all })),
      saleCount,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: true,
        materials: {
          where: { material: { isActive: true } },
          include: { material: true },
          orderBy: { materialId: 'asc' },
        },
        sizes: { orderBy: [{ widthCm: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    const { materials, sizes, isActive, createdAt, updatedAt, categoryId, ...fields } = product;
    const byRole = (role: string) => materials.filter((link) => link.role === role);

    return {
      ...fields,
      mainMaterials: byRole('MAIN').map((link) => link.material),
      colorMaterials: byRole('COLOR').map((link) => link.material),
      woodMaterials: byRole('WOOD').map((link) => link.material),
      sizes: sizes.map(({ productId, ...size }) => size),
      defaults: {
        mainMaterialId: pickDefault(byRole('MAIN'))?.materialId ?? null,
        colorMaterialId: pickDefault(byRole('COLOR'))?.materialId ?? null,
        woodMaterialId: pickDefault(byRole('WOOD'))?.materialId ?? null,
        sizeId: pickDefault(sizes)?.id ?? null,
      },
    };
  }
}

// Вариант с отметкой «по умолчанию», а если её нет — первый в списке
export function pickDefault<T extends { isDefault: boolean }>(options: T[]): T | undefined {
  return options.find((option) => option.isDefault) ?? options[0];
}

function pick(material: { id: number; name: string; hex: string }) {
  return { id: material.id, name: material.name, hex: material.hex };
}
