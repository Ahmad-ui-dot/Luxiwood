import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto';
import { MaterialQueryDto } from './dto/material-query.dto';

const ORDER = [{ type: 'asc' as const }, { id: 'asc' as const }];

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  findActive(query: MaterialQueryDto) {
    return this.prisma.material.findMany({ where: { isActive: true, type: query.type }, orderBy: ORDER });
  }

  async findAllForAdmin(query: MaterialQueryDto) {
    const materials = await this.prisma.material.findMany({
      where: { type: query.type },
      orderBy: ORDER,
      include: { _count: { select: { products: true } } },
    });
    return materials.map(({ _count, ...material }) => ({ ...material, productsCount: _count.products }));
  }

  create(dto: CreateMaterialDto) {
    return this.prisma.material.create({ data: dto });
  }

  async update(id: number, dto: UpdateMaterialDto) {
    const material = await this.findOne(id);
    if (dto.type && dto.type !== material.type) {
      const used = await this.prisma.productMaterial.count({ where: { materialId: id } });
      if (used > 0) {
        throw new ConflictException('Нельзя сменить тип: материал уже привязан к товарам');
      }
    }
    return this.prisma.material.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    const [products, orderItems] = await Promise.all([
      this.prisma.productMaterial.count({ where: { materialId: id } }),
      this.prisma.orderItem.count({
        where: { OR: [{ mainMaterialId: id }, { colorMaterialId: id }, { woodMaterialId: id }, { finishMaterialId: id }] },
      }),
    ]);
    if (products > 0 || orderItems > 0) {
      throw new ConflictException(
        `Материал используется (товаров: ${products}, позиций в заказах: ${orderItems}). ` +
          'Отключите его через isActive = false — покупатели перестанут его видеть',
      );
    }
    return this.prisma.material.delete({ where: { id } });
  }


  private async findOne(id: number) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new NotFoundException('Материал не найден');
    }
    return material;
  }
}

