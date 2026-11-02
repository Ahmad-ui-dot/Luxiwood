import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LIST_SELECT } from '../products/products.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  // Скрытые администратором товары в избранном не показываются
  async findAll(userId: number) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId, product: { isActive: true } },
      include: { product: { select: LIST_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((item) => ({ addedAt: item.createdAt, product: item.product }));
  }

  // Повторное добавление — не ошибка
  async add(userId: number, productId: number) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    return { productId, inWishlist: true };
  }

  // Удаление того, чего нет, — тоже не ошибка
  async remove(userId: number, productId: number) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return { productId, inWishlist: false };
  }
}
