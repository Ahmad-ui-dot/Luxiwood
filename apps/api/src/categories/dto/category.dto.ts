import { SLUG_PATTERN } from '@luxiwood/shared';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../common/query-transforms';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Адрес в URL: латиница, цифры и дефисы. Уникальный', pattern: SLUG_PATTERN.source, maxLength: 60, example: 'komody' })
  @Trim()
  @Matches(SLUG_PATTERN, { message: 'slug: только латиница в нижнем регистре, цифры и дефисы, например komody' })
  @MaxLength(60, { message: 'slug — не длиннее 60 символов' })
  slug: string;

  @ApiProperty({ description: 'Название', minLength: 2, maxLength: 60, example: 'Комоды' })
  @Trim()
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(2, { message: 'Название — от 2 до 60 символов' })
  @MaxLength(60, { message: 'Название — от 2 до 60 символов' })
  name: string;

  @ApiPropertyOptional({ description: 'Порядок в меню: меньше — выше', type: 'integer', minimum: 0, maximum: 1000, default: 0, example: 7 })
  @IsOptional()
  @IsInt({ message: 'Порядок должен быть целым числом' })
  @Min(0, { message: 'Порядок — от 0 до 1000' })
  @Max(1000, { message: 'Порядок — от 0 до 1000' })
  sortOrder?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
