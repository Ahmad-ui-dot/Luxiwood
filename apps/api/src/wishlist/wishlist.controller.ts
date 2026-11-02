import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { AuthUser } from '../auth/auth.guard';
import { ApiError } from '../common/api-error.decorator';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { ProductListItemDto } from '../products/dto/product.response.dto';
import { WishlistService } from './wishlist.service';

export class WishlistItemDto {
  @ApiProperty({ description: 'Когда добавлен', type: String, format: 'date-time', example: '2026-10-29T15:00:00.000Z' })
  addedAt: string;

  @ApiProperty({ description: 'Товар', type: ProductListItemDto })
  product: ProductListItemDto;
}

export class WishlistStateDto {
  @ApiProperty({ description: 'ID товара', type: 'integer', example: 1 })
  productId: number;

  @ApiProperty({ description: 'Есть ли товар в избранном после запроса', example: true })
  inWishlist: boolean;
}

const PRODUCT_PARAM = { name: 'productId', description: 'ID товара', example: 1 };

@ApiTags('Мой кабинет')
@Auth()
@Controller('me/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Избранное', description: 'Нужен вход. Товары в избранном, последние добавленные сверху. Скрытые товары не показываются.' })
  @ApiOkResponse({ description: 'Избранное', type: [WishlistItemDto] })
  findAll(@CurrentUser() user: AuthUser) {
    return this.wishlistService.findAll(user.id);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Добавить в избранное', description: 'Нужен вход. Повторное добавление — не ошибка.' })
  @ApiParam(PRODUCT_PARAM)
  @ApiCreatedResponse({ description: 'Товар в избранном', type: WishlistStateDto })
  @ApiError(404, 'Товар не найден')
  add(@CurrentUser() user: AuthUser, @Param('productId', ParseIdPipe) productId: number) {
    return this.wishlistService.add(user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Убрать из избранного', description: 'Нужен вход. Если товара в избранном нет — тоже 200.' })
  @ApiParam(PRODUCT_PARAM)
  @ApiOkResponse({ description: 'Товара в избранном нет', type: WishlistStateDto, example: { productId: 1, inWishlist: false } })
  @ApiError(400, 'ID в адресе должен быть целым числом')
  remove(@CurrentUser() user: AuthUser, @Param('productId', ParseIdPipe) productId: number) {
    return this.wishlistService.remove(user.id, productId);
  }
}
