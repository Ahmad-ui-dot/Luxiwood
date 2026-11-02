import { CONFIGURATOR_TYPES, ConfiguratorPrices, DeliverySettings } from '@luxiwood/shared';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';
import { DEFAULT_SETTINGS, ShopSettings } from './settings.defaults';

const OPTION_KEYS = Object.values(CONFIGURATOR_TYPES).flatMap((type) => type.options.map((option) => option.key));

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Настройки из базы поверх значений по умолчанию: если ключа нет, работает значение по умолчанию
  async getAll(): Promise<ShopSettings> {
    const rows = await this.prisma.setting.findMany({ where: { key: { in: Object.keys(DEFAULT_SETTINGS) } } });
    const saved = Object.fromEntries(rows.map((row) => [row.key, row.value])) as Partial<ShopSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      configuratorBasePrices: { ...DEFAULT_SETTINGS.configuratorBasePrices, ...saved.configuratorBasePrices },
      configuratorOptionPrices: { ...DEFAULT_SETTINGS.configuratorOptionPrices, ...saved.configuratorOptionPrices },
    };
  }

  async getPublic() {
    const { deliveryPrice, freeDeliveryFrom, workshopPhone, workshopHours } = await this.getAll();
    return { deliveryPrice, freeDeliveryFrom, workshopPhone, workshopHours };
  }

  async getDelivery(): Promise<DeliverySettings> {
    const { deliveryPrice, freeDeliveryFrom } = await this.getAll();
    return { deliveryPrice, freeDeliveryFrom };
  }

  async getConfiguratorPrices(): Promise<ConfiguratorPrices> {
    const settings = await this.getAll();
    return { basePrices: settings.configuratorBasePrices, optionPrices: settings.configuratorOptionPrices };
  }

  async update(dto: UpdateSettingsDto) {
    const current = await this.getAll();
    const changes: Partial<ShopSettings> = { ...dto };
    if (dto.configuratorBasePrices) {
      changes.configuratorBasePrices = { ...dto.configuratorBasePrices };
    }
    if (dto.configuratorOptionPrices) {
      changes.configuratorOptionPrices = {
        ...current.configuratorOptionPrices,
        ...checkOptionPrices(dto.configuratorOptionPrices),
      };
    }

    // Непереданные поля DTO равны undefined — их не трогаем
    const entries = Object.entries(changes).filter(([, value]) => value !== undefined);
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value: value as Prisma.InputJsonValue },
          update: { value: value as Prisma.InputJsonValue },
        }),
      ),
    );
    return this.getAll();
  }
}

function checkOptionPrices(prices: Record<string, unknown>): Record<string, number> {
  for (const [key, price] of Object.entries(prices)) {
    if (!OPTION_KEYS.includes(key)) {
      throw new BadRequestException(`Нет такой опции конструктора: «${key}»`);
    }
    if (typeof price !== 'number' || !Number.isInteger(price) || price < 0 || price > 1000000) {
      throw new BadRequestException(`Цена опции «${key}» — целое число от 0 до 1 000 000 сомони`);
    }
  }
  return prices as Record<string, number>;
}
