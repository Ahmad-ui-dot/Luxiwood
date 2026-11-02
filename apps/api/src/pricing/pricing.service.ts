import { calcProductPrice, checkFit } from '@luxiwood/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MaterialRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { pickDefault } from '../products/products.service';
import { FitDto, QuoteDto } from './dto/pricing.dto';

const ROLE_ERRORS: Record<MaterialRole, string> = {
  MAIN: 'Этот материал недоступен для товара',
  COLOR: 'Этот цвет недоступен для товара',
  WOOD: 'Это дерево недоступно для товара',
};

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(dto: QuoteDto) {
    const { price, selection } = await this.priceProduct(dto);
    return { ...price, selection };
  }

  // Проверяет выбор покупателя по товару и считает цену. Используется и в расчёте, и в заказе
  async priceProduct(dto: QuoteDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      include: {
        materials: { where: { material: { isActive: true } }, include: { material: true } },
        sizes: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    // Выбранный вариант должен быть в списке разрешённых. Не прислан — берётся вариант по умолчанию
    const choose = (role: MaterialRole, id: number | undefined, required: boolean) => {
      const links = product.materials.filter((link) => link.role === role);
      if (id === undefined) {
        return required ? undefined : pickDefault(links)?.material;
      }
      const link = links.find((item) => item.materialId === id);
      if (!link) {
        throw new BadRequestException(ROLE_ERRORS[role]);
      }
      return link.material;
    };

    const main = choose('MAIN', dto.mainMaterialId, true)!;
    const color = choose('COLOR', dto.colorMaterialId, false);
    const wood = choose('WOOD', dto.woodMaterialId, false);

    const size = dto.sizeId === undefined ? pickDefault(product.sizes) : product.sizes.find((item) => item.id === dto.sizeId);
    if (dto.sizeId !== undefined && !size) {
      throw new BadRequestException('Этот размер недоступен для товара');
    }

    const price = calcProductPrice({
      basePrice: product.basePrice,
      mainMaterial: main,
      colorMaterial: color,
      woodMaterial: wood,
      size: size ? { name: size.label, priceDelta: size.priceDelta } : undefined,
      quantity: dto.quantity,
    });
    const selection = {
      mainMaterialId: main.id,
      colorMaterialId: color?.id ?? null,
      woodMaterialId: wood?.id ?? null,
      sizeId: size?.id ?? null,
    };
    return { product, main, color, wood, size, price, selection };
  }

  async fit(dto: FitDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
      include: { sizes: true },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    const size = dto.sizeId === undefined ? pickDefault(product.sizes) : product.sizes.find((item) => item.id === dto.sizeId);
    if (dto.sizeId !== undefined && !size) {
      throw new BadRequestException('Этот размер недоступен для товара');
    }
    return checkFit(size?.widthCm ?? product.widthCm, dto.nicheWidthCm);
  }
}
