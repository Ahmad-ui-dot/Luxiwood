import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  }

  async findAllForAdmin() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return categories.map(({ _count, ...category }) => ({ ...category, productsCount: _count.products }));
  }

  async create(dto: CreateCategoryDto) {
    await this.checkSlugFree(dto.slug);
    return this.prisma.category.create({ data: dto });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.slug) {
      await this.checkSlugFree(dto.slug, id);
    }
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    const products = await this.prisma.product.count({ where: { categoryId: id } });
    if (products > 0) {
      throw new ConflictException(
        `Нельзя удалить категорию: в ней товаров — ${products}. Сначала перенесите их в другую категорию или удалите`,
      );
    }
    return this.prisma.category.delete({ where: { id } });
  }

  private async findOne(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
    return category;
  }

  private async checkSlugFree(slug: string, exceptId?: number) {
    const taken = await this.prisma.category.findUnique({ where: { slug } });
    if (taken && taken.id !== exceptId) {
      throw new ConflictException(`Категория со slug «${slug}» уже есть`);
    }
  }
}
