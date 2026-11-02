import { calcConfiguratorPrice, CONFIGURATOR_TYPES, MaterialType } from '@luxiwood/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ConfiguratorQuoteDto } from './dto/configurator.dto';

const MATERIAL_NAMES: Record<MaterialType, string> = { FABRIC: 'Ткань', COLOR: 'Цвет', WOOD: 'Дерево', FINISH: 'Покрытие' };

@Injectable()
export class ConfiguratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async options() {
    const [materials, prices] = await Promise.all([
      this.prisma.material.findMany({ where: { isActive: true }, orderBy: [{ type: 'asc' }, { id: 'asc' }] }),
      this.settings.getConfiguratorPrices(),
    ]);
    const ofType = (type: MaterialType) => materials.filter((material) => material.type === type);

    return {
      types: Object.values(CONFIGURATOR_TYPES).map(({ genitive, ...config }) => ({
        ...config,
        basePrice: prices.basePrices[config.type],
        fabrics: config.usesUpholstery ? ofType('FABRIC') : [],
        colors: config.usesUpholstery ? ofType('COLOR') : [],
        woods: ofType('WOOD'),
        finishes: ofType('FINISH'),
        options: config.options.map((option) => ({ ...option, price: prices.optionPrices[option.key] ?? 0 })),
      })),
    };
  }

  async quote(dto: ConfiguratorQuoteDto) {
    const { price } = await this.priceConfigurator(dto);
    return price;
  }

  // Проверяет материалы и считает цену. Используется и в расчёте, и в заказе
  async priceConfigurator(dto: ConfiguratorQuoteDto) {
    const [upholstery, color, wood, finish] = await Promise.all([
      this.material(dto.upholsteryMaterialId, 'FABRIC'),
      this.material(dto.colorMaterialId, 'COLOR'),
      this.material(dto.woodMaterialId, 'WOOD'),
      this.material(dto.finishMaterialId, 'FINISH'),
    ]);
    const price = calcConfiguratorPrice(
      {
        type: dto.type,
        widthCm: dto.widthCm,
        depthCm: dto.depthCm,
        heightCm: dto.heightCm,
        upholstery,
        color,
        wood: wood!,
        finish: finish!,
        options: dto.options,
        quantity: dto.quantity,
      },
      await this.settings.getConfiguratorPrices(),
    );
    return { price, upholstery, color, wood: wood!, finish: finish! };
  }

  // Активный материал нужного типа. id не передан — undefined
  private async material(id: number | undefined, type: MaterialType) {
    if (id === undefined) {
      return undefined;
    }
    const material = await this.prisma.material.findFirst({ where: { id, type, isActive: true } });
    if (!material) {
      throw new BadRequestException(`${MATERIAL_NAMES[type]}: материал с ID ${id} не найден или отключён`);
    }
    return material;
  }
}
