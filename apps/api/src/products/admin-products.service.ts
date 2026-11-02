import { MaterialRole, ProductKind } from '@luxiwood/shared';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pageArgs, paginate } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminProductQueryDto,
  CreateProductDto,
  CreateProductSizeDto,
  ProductMaterialInputDto,
  UpdateProductDto,
  UpdateProductSizeDto,
} from './dto/admin-product.dto';
import { LIST_SELECT } from './products.service';

// Какой тип материала подходит к роли
const ROLE_TYPES: Record<MaterialRole, (kind: ProductKind) => string> = {
  MAIN: (kind) => kind, // FABRIC или WOOD — как основной материал товара
  COLOR: () => 'COLOR',
  WOOD: () => 'WOOD',
};

const ROLE_NAMES: Record<MaterialRole, string> = { MAIN: 'основной материал', COLOR: 'цвет', WOOD: 'дерево' };

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      categoryId: query.categoryId,
      isActive: query.isActive,
      room: query.room,
      model3dKey: query.type,
      badge: query.badge,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { sku: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: { ...LIST_SELECT, isActive: true, createdAt: true, updatedAt: true },
        orderBy: { id: 'desc' },
        ...pageArgs(query),
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(items, total, query);
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        materials: { include: { material: true }, orderBy: [{ role: 'asc' }, { materialId: 'asc' }] },
        sizes: { orderBy: [{ widthCm: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    const { materials, sizes, ...fields } = product;
    return {
      ...fields,
      materials: materials.map(({ productId, ...link }) => link),
      sizes: sizes.map(({ productId, ...size }) => size),
    };
  }

  async create(dto: CreateProductDto) {
    const { materials = [], sizes = [], ...data } = dto;
    await this.checkCategory(data.categoryId);
    await this.checkUnique(data.slug, data.sku);
    checkOldPrice(data.basePrice, data.oldPrice);
    await this.checkMaterials(data.kind, materials);
    checkOneDefault(sizes, 'размер');

    const defaultSize = sizes.find((size) => size.isDefault) ?? sizes[0];
    const widthCm = data.widthCm ?? defaultSize?.widthCm;
    if (!widthCm) {
      throw new BadRequestException('Укажите widthCm или хотя бы один размер');
    }

    const product = await this.prisma.product.create({
      data: { ...data, widthCm, materials: { create: materials }, sizes: { create: sizes } },
    });
    return this.findOne(product.id);
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (dto.categoryId) {
      await this.checkCategory(dto.categoryId);
    }
    await this.checkUnique(dto.slug, dto.sku, id);
    checkOldPrice(dto.basePrice ?? product.basePrice, dto.oldPrice === undefined ? product.oldPrice : dto.oldPrice);
    if (dto.kind && dto.kind !== product.kind) {
      // Основные материалы должны подходить к новому kind
      await this.checkMaterials(dto.kind, product.materials);
    }

    await this.prisma.product.update({ where: { id }, data: dto });
    return this.findOne(id);
  }

  // Товар из заказов не удаляется, а скрывается: иначе в старых заказах пропадёт ссылка на него
  async remove(id: number) {
    await this.findOne(id);
    const orderItems = await this.prisma.orderItem.count({ where: { productId: id } });
    if (orderItems > 0) {
      await this.prisma.product.update({ where: { id }, data: { isActive: false } });
      return {
        deleted: false,
        hidden: true,
        message: `Товар есть в заказах (${orderItems}), поэтому он не удалён, а скрыт из каталога`,
      };
    }
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true, hidden: false, message: 'Товар удалён' };
  }

  async setMaterials(id: number, materials: ProductMaterialInputDto[]) {
    const product = await this.findOne(id);
    await this.checkMaterials(product.kind, materials);
    await this.prisma.$transaction([
      this.prisma.productMaterial.deleteMany({ where: { productId: id } }),
      this.prisma.productMaterial.createMany({
        data: materials.map((link) => ({ ...link, productId: id, isDefault: link.isDefault ?? false })),
      }),
    ]);
    return this.findOne(id);
  }

  async addSize(productId: number, dto: CreateProductSizeDto) {
    await this.findOne(productId);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.productSize.updateMany({ where: { productId }, data: { isDefault: false } });
      }
      const { productId: _, ...size } = await tx.productSize.create({ data: { ...dto, productId } });
      return size;
    });
  }

  async updateSize(productId: number, sizeId: number, dto: UpdateProductSizeDto) {
    await this.findSize(productId, sizeId);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.productSize.updateMany({ where: { productId, id: { not: sizeId } }, data: { isDefault: false } });
      }
      const { productId: _, ...size } = await tx.productSize.update({ where: { id: sizeId }, data: dto });
      return size;
    });
  }

  // В заказах размер сохраняется в снимке, поэтому его можно удалять
  async removeSize(productId: number, sizeId: number) {
    await this.findSize(productId, sizeId);
    const { productId: _, ...size } = await this.prisma.productSize.delete({ where: { id: sizeId } });
    return size;
  }

  private async findSize(productId: number, sizeId: number) {
    const size = await this.prisma.productSize.findFirst({ where: { id: sizeId, productId } });
    if (!size) {
      throw new NotFoundException('Размер не найден у этого товара');
    }
    return size;
  }

  private async checkCategory(categoryId: number) {
    if (!(await this.prisma.category.findUnique({ where: { id: categoryId } }))) {
      throw new BadRequestException(`Категория с ID ${categoryId} не найдена`);
    }
  }

  private async checkUnique(slug?: string, sku?: string, exceptId?: number) {
    const taken = await this.prisma.product.findFirst({
      where: {
        id: exceptId ? { not: exceptId } : undefined,
        OR: [...(slug ? [{ slug }] : []), ...(sku ? [{ sku }] : [])],
      },
    });
    if (taken && slug && taken.slug === slug) {
      throw new ConflictException(`Товар со slug «${slug}» уже есть`);
    }
    if (taken && sku && taken.sku === sku) {
      throw new ConflictException(`Товар с артикулом «${sku}» уже есть`);
    }
  }

  // Материал существует, подходит к роли, не повторяется; в каждой роли не больше одного по умолчанию
  private async checkMaterials(kind: ProductKind, links: { materialId: number; role: MaterialRole; isDefault?: boolean }[]) {
    const ids = [...new Set(links.map((link) => link.materialId))];
    const found = await this.prisma.material.findMany({ where: { id: { in: ids } } });
    const seen = new Set<string>();

    for (const link of links) {
      const material = found.find((item) => item.id === link.materialId);
      if (!material) {
        throw new BadRequestException(`Материал с ID ${link.materialId} не найден`);
      }
      const expected = ROLE_TYPES[link.role](kind);
      if (material.type !== expected) {
        throw new BadRequestException(
          `«${material.name}» (${material.type}) нельзя выбрать как ${ROLE_NAMES[link.role]}: здесь нужен материал типа ${expected}`,
        );
      }
      const key = `${link.role}:${link.materialId}`;
      if (seen.has(key)) {
        throw new BadRequestException(`Материал «${material.name}» указан дважды`);
      }
      seen.add(key);
    }
    for (const role of Object.keys(ROLE_TYPES) as MaterialRole[]) {
      checkOneDefault(links.filter((link) => link.role === role), ROLE_NAMES[role]);
    }
  }
}

function checkOldPrice(basePrice: number, oldPrice: number | null | undefined) {
  if (oldPrice !== null && oldPrice !== undefined && oldPrice <= basePrice) {
    throw new BadRequestException('Старая цена (oldPrice) должна быть больше текущей — иначе это не скидка');
  }
}

function checkOneDefault(items: { isDefault?: boolean }[], name: string) {
  if (items.filter((item) => item.isDefault).length > 1) {
    throw new BadRequestException(`По умолчанию можно отметить только один вариант: ${name}`);
  }
}
