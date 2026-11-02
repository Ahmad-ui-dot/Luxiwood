import { ConfiguratorPrices, DEFAULT_CONFIGURATOR_PRICES } from '@luxiwood/shared';

// Все настройки магазина. Хранятся в таблице Setting по ключам, значение — JSON
export interface ShopSettings {
  deliveryPrice: number;
  freeDeliveryFrom: number;
  workshopPhone: string;
  workshopHours: string;
  configuratorBasePrices: ConfiguratorPrices['basePrices'];
  configuratorOptionPrices: ConfiguratorPrices['optionPrices'];
}

// Значения по умолчанию: ими заполняется база (seed), и они же используются, если ключа в базе нет.
// Цены примерные — их нужно заменить реальными ценами мастерской.
export const DEFAULT_SETTINGS: ShopSettings = {
  deliveryPrice: 150,
  freeDeliveryFrom: 5000,
  workshopPhone: '+992 93 000 00 00',
  workshopHours: 'Пн–Сб 9:00–19:00',
  configuratorBasePrices: DEFAULT_CONFIGURATOR_PRICES.basePrices,
  configuratorOptionPrices: DEFAULT_CONFIGURATOR_PRICES.optionPrices,
};
