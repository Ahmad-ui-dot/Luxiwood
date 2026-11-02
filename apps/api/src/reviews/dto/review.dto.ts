import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination';
import { ToBoolean, Trim } from '../../common/query-transforms';

export class CreateReviewDto {
  @ApiProperty({ description: 'Оценка от 1 до 5', type: 'integer', minimum: 1, maximum: 5, example: 5 })
  @IsInt({ message: 'Оценка — целое число от 1 до 5' })
  @Min(1, { message: 'Оценка — целое число от 1 до 5' })
  @Max(5, { message: 'Оценка — целое число от 1 до 5' })
  rating: number;

  @ApiProperty({ description: 'Текст отзыва', minLength: 10, maxLength: 2000, example: 'Диван сделали за 12 дней, ткань как на образце.' })
  @Trim()
  @IsString({ message: 'Текст отзыва должен быть строкой' })
  @MinLength(10, { message: 'Отзыв — от 10 до 2000 символов' })
  @MaxLength(2000, { message: 'Отзыв — от 10 до 2000 символов' })
  text: string;
}

export class UpdateReviewDto {
  @ApiProperty({ description: 'true — показывать на сайте, false — скрыть', example: false })
  @IsBoolean({ message: 'isApproved — true или false' })
  isApproved: boolean;
}

export class AdminReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'true — только показанные, false — только скрытые', type: Boolean, example: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({ message: 'isApproved — true или false' })
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'ID товара', type: 'integer', minimum: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID товара — целое число' })
  @Min(1, { message: 'ID товара — целое число' })
  productId?: number;
}
