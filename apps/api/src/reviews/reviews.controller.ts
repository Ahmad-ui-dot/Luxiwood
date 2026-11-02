import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { AuthUser } from '../auth/auth.guard';
import { ApiError, ApiValidationError } from '../common/api-error.decorator';
import { ApiPaginatedResponse } from '../common/dto/paginated-response.dto';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { AdminReviewQueryDto, CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { AdminReviewDto, LatestReviewsDto, ProductReviewsDto, ReviewDto } from './dto/review.response.dto';
import { ReviewsService } from './reviews.service';

const PRODUCT_PARAM = { name: 'id', description: 'ID товара', example: 1 };

@ApiTags('Отзывы')
@Controller('products/:id/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Отзывы о товаре', description: 'Доступно всем, без входа. Только показанные (одобренные) отзывы и средняя оценка.' })
  @ApiParam(PRODUCT_PARAM)
  @ApiOkResponse({ description: 'Отзывы', type: ProductReviewsDto })
  @ApiError(404, 'Товар не найден')
  findAll(@Param('id', ParseIdPipe) productId: number) {
    return this.reviewsService.findForProduct(productId);
  }

  @Post()
  @Roles('CLIENT')
  @ApiOperation({
    summary: 'Оставить отзыв',
    description: 'Нужен вход покупателя (роль CLIENT). Один отзыв на товар от одного человека. Отзыв сразу виден, средняя оценка товара пересчитывается.',
  })
  @ApiParam(PRODUCT_PARAM)
  @ApiBody({ type: CreateReviewDto, examples: { good: { summary: 'Хороший отзыв', value: { rating: 5, text: 'Диван сделали за 12 дней, ткань как на образце.' } } } })
  @ApiCreatedResponse({ description: 'Отзыв добавлен', type: ReviewDto })
  @ApiValidationError('Оценка — целое число от 1 до 5', 'Отзыв — от 10 до 2000 символов')
  @ApiError(404, 'Товар не найден')
  @ApiError(409, 'Вы уже оставили отзыв на этот товар')
  create(@Param('id', ParseIdPipe) productId: number, @CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(productId, user.id, dto);
  }
}

@ApiTags('Отзывы')
@Controller('reviews')
export class LatestReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Последние отзывы', description: 'Доступно всем, без входа. Для главной: до 12 свежих отзывов (сначала от разных покупателей) и общая оценка магазина.' })
  @ApiOkResponse({ description: 'Отзывы', type: LatestReviewsDto })
  findLatest() {
    return this.reviewsService.findLatest();
  }
}

@ApiTags('Админ: отзывы')
@Roles('ADMIN')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Все отзывы', description: 'Только администратор. Вместе со скрытыми. Фильтры: показан или скрыт, товар. Новые — сверху.' })
  @ApiPaginatedResponse(AdminReviewDto, 'Страница отзывов')
  @ApiValidationError('isApproved — true или false')
  findAll(@Query() query: AdminReviewQueryDto) {
    return this.reviewsService.findAllForAdmin(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Показать или скрыть отзыв', description: 'Только администратор. Средняя оценка и число отзывов товара пересчитываются.' })
  @ApiParam({ name: 'id', description: 'ID отзыва', example: 1 })
  @ApiBody({ type: UpdateReviewDto, examples: { hide: { summary: 'Скрыть', value: { isApproved: false } } } })
  @ApiOkResponse({ description: 'Отзыв изменён', type: AdminReviewDto })
  @ApiValidationError('isApproved — true или false')
  @ApiError(404, 'Отзыв не найден')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.setApproved(id, dto.isApproved);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить отзыв', description: 'Только администратор. Средняя оценка и число отзывов товара пересчитываются.' })
  @ApiParam({ name: 'id', description: 'ID отзыва', example: 1 })
  @ApiOkResponse({ description: 'Отзыв удалён — в ответе удалённая запись', type: AdminReviewDto })
  @ApiError(404, 'Отзыв не найден')
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.reviewsService.remove(id);
  }
}
