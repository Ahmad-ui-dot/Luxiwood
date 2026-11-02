// Конструктор мебели под свои размеры: диван, кресло, кровать, шкаф, стол.
// Формула одна для всех типов:
//   1) основа = базовая цена типа × (объём выбранного размера / объём размера по умолчанию);
//   2) доплаты за ткань, цвет, дерево и отделку растут вместе с размером так же, как основа;
//   3) опции — фиксированная цена;
//   4) итог округляется вверх до 10 сомони.
import { ConfiguratorKey } from './enums';
import { checkQuantity, PriceLine, PricedOption, PricingError, sumLines } from './pricing';

export interface SizeRange {
  min: number;
  max: number;
  default: number;
}

export interface ConfiguratorOption {
  key: string;
  label: string;
  days: number; // сколько дней добавляет к сроку
}

export interface ConfiguratorType {
  type: ConfiguratorKey;
  label: string;
  genitive: string; // «Ширина дивана …»
  widthCm: SizeRange;
  depthCm: SizeRange;
  heightCm: SizeRange;
  usesUpholstery: boolean; // мягкая мебель: выбирается ткань и цвет
  days: number; // срок изготовления без опций
  options: ConfiguratorOption[];
}

export const CONFIGURATOR_TYPES: Record<ConfiguratorKey, ConfiguratorType> = {
  sofa: {
    type: 'sofa',
    label: 'Диван',
    genitive: 'дивана',
    widthCm: { min: 140, max: 320, default: 210 },
    depthCm: { min: 80, max: 120, default: 95 },
    heightCm: { min: 75, max: 100, default: 85 },
    usesUpholstery: true,
    days: 14,
    options: [
      { key: 'sofa-mechanism', label: 'Механизм «еврокнижка»', days: 3 },
      { key: 'sofa-storage', label: 'Ящик для белья', days: 1 },
      { key: 'sofa-pillows', label: 'Декоративные подушки, 2 шт.', days: 0 },
    ],
  },
  armchair: {
    type: 'armchair',
    label: 'Кресло',
    genitive: 'кресла',
    widthCm: { min: 60, max: 110, default: 82 },
    depthCm: { min: 70, max: 100, default: 84 },
    heightCm: { min: 80, max: 110, default: 92 },
    usesUpholstery: true,
    days: 10,
    options: [
      { key: 'armchair-ottoman', label: 'Пуф для ног в той же ткани', days: 2 },
      { key: 'armchair-rocking', label: 'Механизм качания', days: 2 },
    ],
  },
  bed: {
    type: 'bed',
    label: 'Кровать',
    genitive: 'кровати',
    widthCm: { min: 100, max: 220, default: 170 },
    depthCm: { min: 200, max: 230, default: 210 },
    heightCm: { min: 90, max: 130, default: 110 },
    usesUpholstery: true,
    days: 14,
    options: [
      { key: 'bed-lift', label: 'Подъёмный механизм с ящиком', days: 3 },
      { key: 'bed-orthopedic', label: 'Ортопедическое основание', days: 0 },
      { key: 'bed-high-headboard', label: 'Высокое мягкое изголовье', days: 1 },
    ],
  },
  wardrobe: {
    type: 'wardrobe',
    label: 'Шкаф',
    genitive: 'шкафа',
    widthCm: { min: 60, max: 300, default: 160 },
    depthCm: { min: 35, max: 70, default: 60 },
    heightCm: { min: 150, max: 280, default: 220 },
    usesUpholstery: false,
    days: 16,
    options: [
      { key: 'wardrobe-mirror', label: 'Зеркало на дверь', days: 1 },
      { key: 'wardrobe-led', label: 'LED-подсветка', days: 1 },
      { key: 'wardrobe-soft-close', label: 'Доводчики на все двери', days: 0 },
    ],
  },
  table: {
    type: 'table',
    label: 'Стол',
    genitive: 'стола',
    widthCm: { min: 80, max: 260, default: 160 },
    depthCm: { min: 60, max: 120, default: 90 },
    heightCm: { min: 70, max: 80, default: 75 },
    usesUpholstery: false,
    days: 10,
    options: [
      { key: 'table-extendable', label: 'Раздвижная столешница', days: 3 },
      { key: 'table-rounded', label: 'Скруглённые углы', days: 0 },
    ],
  },
};

// Цены конструктора хранятся в настройках и меняются администратором
export interface ConfiguratorPrices {
  basePrices: Record<ConfiguratorKey, number>; // цена каждого типа в размере по умолчанию, без доплат
  optionPrices: Record<string, number>; // цена опции по её key
}

export const DEFAULT_CONFIGURATOR_PRICES: ConfiguratorPrices = {
  basePrices: { sofa: 7900, armchair: 3200, bed: 6200, wardrobe: 6900, table: 2700 },
  optionPrices: {
    'sofa-mechanism': 1200,
    'sofa-storage': 600,
    'sofa-pillows': 250,
    'armchair-ottoman': 900,
    'armchair-rocking': 700,
    'bed-lift': 1500,
    'bed-orthopedic': 800,
    'bed-high-headboard': 500,
    'wardrobe-mirror': 450,
    'wardrobe-led': 600,
    'wardrobe-soft-close': 300,
    'table-extendable': 1400,
    'table-rounded': 200,
  },
};

export interface ConfiguratorInput {
  type: ConfiguratorKey;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  upholstery?: PricedOption; // ткань — обязательна для мягкой мебели
  color?: PricedOption;
  wood: PricedOption;
  finish: PricedOption;
  options: string[];
  quantity?: number;
}

export interface ConfiguratorPrice {
  price: number; // за одну штуку, кратно 10
  quantity: number;
  total: number;
  days: number;
  summary: string;
  breakdown: PriceLine[];
}

export function calcConfiguratorPrice(input: ConfiguratorInput, prices: ConfiguratorPrices): ConfiguratorPrice {
  const config = CONFIGURATOR_TYPES[input.type];
  if (!config) {
    throw new PricingError('Неизвестный тип мебели');
  }
  const quantity = input.quantity ?? 1;
  checkQuantity(quantity);
  checkSize(input.widthCm, config.widthCm, `Ширина ${config.genitive}`);
  checkSize(input.depthCm, config.depthCm, `Глубина ${config.genitive}`);
  checkSize(input.heightCm, config.heightCm, `Высота ${config.genitive}`);
  if (config.usesUpholstery && !input.upholstery) {
    throw new PricingError(`Выберите ткань обивки для: ${config.label.toLowerCase()}`);
  }
  if (!config.usesUpholstery && (input.upholstery || input.color)) {
    throw new PricingError(`${config.label} делается без обивки — ткань и цвет не выбираются`);
  }
  const options = checkOptions(input.options, config);

  const ratio =
    (input.widthCm * input.depthCm * input.heightCm) /
    (config.widthCm.default * config.depthCm.default * config.heightCm.default);
  const scaled = (amount: number) => Math.round(amount * ratio);
  const sizeText = `${input.widthCm}×${input.depthCm}×${input.heightCm} см`;

  const breakdown: PriceLine[] = [{ label: `${config.label} ${sizeText}`, amount: scaled(prices.basePrices[input.type]) }];
  if (input.upholstery) {
    breakdown.push({ label: `Ткань: ${input.upholstery.name}`, amount: scaled(input.upholstery.priceDelta) });
  }
  if (input.color) {
    breakdown.push({ label: `Цвет: ${input.color.name}`, amount: scaled(input.color.priceDelta) });
  }
  breakdown.push({ label: `Дерево: ${input.wood.name}`, amount: scaled(input.wood.priceDelta) });
  breakdown.push({ label: `Отделка: ${input.finish.name}`, amount: scaled(input.finish.priceDelta) });
  for (const option of options) {
    breakdown.push({ label: `Опция: ${option.label}`, amount: prices.optionPrices[option.key] ?? 0 });
  }

  const subtotal = sumLines(breakdown);
  const price = Math.ceil(subtotal / 10) * 10;
  if (price !== subtotal) {
    breakdown.push({ label: 'Округление до 10 сомони', amount: price - subtotal });
  }

  const days = config.days + options.reduce((total, option) => total + option.days, 0);
  const materials = [input.upholstery?.name, input.color?.name, input.wood.name, input.finish.name].filter(Boolean).join(', ');
  const parts = [`${config.label} ${sizeText}`, materials];
  if (input.type === 'wardrobe') {
    parts.push(`${defaultWardrobeDoors(input.widthCm)} дв., ${wardrobeShelves(input.heightCm)} полок`);
  }
  if (options.length > 0) {
    parts.push(options.map((option) => option.label).join(', '));
  }

  return { price, quantity, total: price * quantity, days, summary: parts.join(' · '), breakdown };
}

// Двери шкафа: одна дверь примерно на 55 см ширины, минимум 2
export function defaultWardrobeDoors(widthCm: number): number {
  return Math.max(2, Math.ceil(widthCm / 55));
}

// Полки шкафа: одна полка на каждые 40 см высоты, кроме верхнего отсека
export function wardrobeShelves(heightCm: number): number {
  return Math.floor(heightCm / 40) - 1;
}

function checkSize(value: number, range: SizeRange, name: string): void {
  if (!Number.isInteger(value) || value < range.min || value > range.max) {
    throw new PricingError(`${name} должна быть целым числом от ${range.min} до ${range.max} см`);
  }
}

function checkOptions(keys: string[], config: ConfiguratorType): ConfiguratorOption[] {
  if (new Set(keys).size !== keys.length) {
    throw new PricingError('Опции не должны повторяться');
  }
  return keys.map((key) => {
    const option = config.options.find((item) => item.key === key);
    if (!option) {
      throw new PricingError(`Опция «${key}» недоступна для типа «${config.label}»`);
    }
    return option;
  });
}
