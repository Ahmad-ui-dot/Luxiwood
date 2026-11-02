import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pageArgs, paginate } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { AdminReviewQueryDto, CreateReviewDto } from './dto/review.dto';

const WITH_NAMES = { user: { select: { name: true } }, product: { select: { name: true } } } satisfies Prisma.ReviewInclude;
type ReviewWithNames = Prisma.ReviewGetPayload<{ include: typeof WITH_NAMES }>;
const LATEST_LIMIT = 12;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Последние отзывы для слайдера на главной. Разные авторы идут первыми, чтобы сразу были видны разные люди
  async findLatest() {
    const where = { isApproved: true, product: { isActive: true } } satisfies Prisma.ReviewWhereInput;
    const [reviews, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.review.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
    ]);

    // Сначала по одному свежему отзыву от каждого автора, потом остальные
    const authors = new Set<number>();
    const firstFromAuthor = [];
    const others = [];
    for (const review of reviews) {
      if (authors.has(review.userId)) {
        others.push(review);
      } else {
        authors.add(review.userId);
        firstFromAuthor.push(review);
      }
    }
    const items = [...firstFromAuthor, ...others]
      .slice(0, LATEST_LIMIT)
      .map((review) => ({ ...toReview(review), productName: review.product.name, productSlug: review.product.slug }));
    return { ratingAvg: Math.round((stats._avg.rating ?? 0) * 10) / 10, reviewsCount: stats._count._all, items };
  }

  async findForProduct(productId: number) {
    const product = await this.findActiveProduct(productId);
    const reviews = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      include: WITH_NAMES,
      orderBy: { id: 'desc' },
    });
    return { ratingAvg: product.ratingAvg, reviewsCount: product.reviewsCount, items: reviews.map(toReview) };
  }

  async create(productId: number, userId: number, dto: CreateReviewDto) {
    await this.findActiveProduct(productId);
    if (await this.prisma.review.findUnique({ where: { productId_userId: { productId, userId } } })) {
      throw new ConflictException('Вы уже оставили отзыв на этот товар');
    }
    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({ data: { productId, userId, ...dto }, include: WITH_NAMES });
      await recalcRating(tx, productId);
      return created;
    });
    return toReview(review);
  }

  async findAllForAdmin(query: AdminReviewQueryDto) {
    const where = { isApproved: query.isApproved, productId: query.productId };
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where, include: WITH_NAMES, orderBy: { id: 'desc' }, ...pageArgs(query) }),
      this.prisma.review.count({ where }),
    ]);
    return paginate(reviews.map(toAdminReview), total, query);
  }

  async setApproved(id: number, isApproved: boolean) {
    const review = await this.findOne(id);
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.review.update({ where: { id }, data: { isApproved }, include: WITH_NAMES });
      await recalcRating(tx, review.productId);
      return result;
    });
    return toAdminReview(updated);
  }

  async remove(id: number) {
    const review = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await recalcRating(tx, review.productId);
    });
    return toAdminReview(review);
  }

  private async findOne(id: number) {
    const review = await this.prisma.review.findUnique({ where: { id }, include: WITH_NAMES });
    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }
    return review;
  }

  private async findActiveProduct(id: number) {
    const product = await this.prisma.product.findFirst({ where: { id, isActive: true } });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    return product;
  }
}

// Средняя оценка и число отзывов товара — только по показанным отзывам
async function recalcRating(tx: Prisma.TransactionClient, productId: number) {
  const stats = await tx.review.aggregate({ where: { productId, isApproved: true }, _avg: { rating: true }, _count: { _all: true } });
  await tx.product.update({
    where: { id: productId },
    data: { ratingAvg: Math.round((stats._avg.rating ?? 0) * 10) / 10, reviewsCount: stats._count._all },
  });
}

function toReview(review: ReviewWithNames) {
  return { id: review.id, rating: review.rating, text: review.text, authorName: review.user.name, createdAt: review.createdAt };
}

function toAdminReview(review: ReviewWithNames) {
  return {
    ...toReview(review),
    isApproved: review.isApproved,
    productId: review.productId,
    productName: review.product.name,
    userId: review.userId,
  };
}
