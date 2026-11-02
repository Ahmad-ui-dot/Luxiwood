import { ApiProperty } from '@nestjs/swagger';

export class ReviewDto {
  @ApiProperty({ description: 'ID отзыва', type: 'integer', example: 1 })
  id: number;

  @ApiProperty({ description: 'Оценка 1–5', type: 'integer', example: 5 })
  rating: number;

  @ApiProperty({ description: 'Текст', example: 'Диван сделали за 12 дней, ткань как на образце.' })
  text: string;

  @ApiProperty({ description: 'Имя автора', example: 'Мадина' })
  authorName: string;

  @ApiProperty({ description: 'Когда оставлен', type: String, format: 'date-time', example: '2026-10-20T12:00:00.000Z' })
  createdAt: string;
}

export class ProductReviewsDto {
  @ApiProperty({ description: 'Средняя оценка, 0 — отзывов нет', example: 4.5 })
  ratingAvg: number;

  @ApiProperty({ description: 'Число показанных отзывов', type: 'integer', example: 2 })
  reviewsCount: number;

  @ApiProperty({ description: 'Отзывы, новые сверху', type: [ReviewDto] })
  items: ReviewDto[];
}

export class LatestReviewDto extends ReviewDto {
  @ApiProperty({ description: 'Название товара', example: 'Диван «Ором»' })
  productName: string;

  @ApiProperty({ description: 'slug товара — для ссылки', example: 'divan-orom' })
  productSlug: string;
}

export class LatestReviewsDto {
  @ApiProperty({ description: 'Средняя оценка по всем показанным отзывам, 0 — отзывов нет', example: 4.7 })
  ratingAvg: number;

  @ApiProperty({ description: 'Число показанных отзывов в магазине', type: 'integer', example: 15 })
  reviewsCount: number;

  @ApiProperty({ description: 'До 12 последних отзывов: сначала по одному от каждого автора, потом остальные', type: [LatestReviewDto] })
  items: LatestReviewDto[];
}

export class AdminReviewDto extends ReviewDto {
  @ApiProperty({ description: 'Показывается ли на сайте', example: true })
  isApproved: boolean;

  @ApiProperty({ description: 'ID товара', type: 'integer', example: 1 })
  productId: number;

  @ApiProperty({ description: 'Название товара', example: 'Диван трёхместный «Ором»' })
  productName: string;

  @ApiProperty({ description: 'ID автора', type: 'integer', example: 2 })
  userId: number;
}
