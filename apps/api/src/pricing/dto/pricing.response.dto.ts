import { FitResult, Quote } from '@luxiwood/shared';
import { ApiProperty } from '@nestjs/swagger';

export class PriceLineDto {
  @ApiProperty({ description: 'Строка расчёта', example: 'Материал: Велюр' })
  label: string;

  @ApiProperty({ description: 'Сумма строки, сомони. Может быть отрицательной (скидка за размер)', type: 'integer', example: 400 })
  amount: number;
}

// Какие варианты взяты в расчёт: присланные или по умолчанию
export class QuoteSelectionDto {
  @ApiProperty({ description: 'ID основного материала', type: 'integer', example: 2 })
  mainMaterialId: number;

  @ApiProperty({ description: 'ID цвета', type: 'integer', nullable: true, example: 6 })
  colorMaterialId: number | null;

  @ApiProperty({ description: 'ID дерева', type: 'integer', nullable: true, example: 11 })
  woodMaterialId: number | null;

  @ApiProperty({ description: 'ID размера', type: 'integer', nullable: true, example: 2 })
  sizeId: number | null;
}

export class QuoteResponseDto implements Quote {
  @ApiProperty({ description: 'Цена за штуку, сомони', type: 'integer', example: 9900 })
  unitPrice: number;

  @ApiProperty({ description: 'Количество', type: 'integer', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Итого = цена × количество, сомони', type: 'integer', example: 19800 })
  total: number;

  @ApiProperty({
    description: 'Расшифровка цены за штуку: база, материал, цвет, дерево, размер',
    type: [PriceLineDto],
    example: [
      { label: 'Базовая цена', amount: 8900 },
      { label: 'Материал: Велюр', amount: 400 },
      { label: 'Цвет: Карамель', amount: 0 },
      { label: 'Дерево: Орех', amount: 600 },
      { label: 'Размер: 210 см', amount: 0 },
    ],
  })
  breakdown: PriceLineDto[];

  @ApiProperty({ description: 'Варианты, по которым посчитано', type: QuoteSelectionDto })
  selection: QuoteSelectionDto;
}

export class FitResponseDto implements FitResult {
  @ApiProperty({ description: 'true — встанет с запасом не меньше 20 см', example: true })
  fits: boolean;

  @ApiProperty({ description: 'Сколько см останется. Отрицательное — не хватает', type: 'integer', example: 20 })
  freeCm: number;

  @ApiProperty({ description: 'Вывод для покупателя', example: 'Встанет: останется 20 см свободного места' })
  verdict: string;
}
