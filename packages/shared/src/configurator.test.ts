import {
  calcConfiguratorPrice,
  CONFIGURATOR_TYPES,
  ConfiguratorInput,
  DEFAULT_CONFIGURATOR_PRICES,
  defaultWardrobeDoors,
  wardrobeShelves,
} from './configurator';
import { ConfiguratorKey } from './enums';
import { PricingError } from './pricing';

const oak = { name: 'Дуб', priceDelta: 0 };
const walnut = { name: 'Орех', priceDelta: 600 };
const oil = { name: 'Масло-воск', priceDelta: 0 };
const boucle = { name: 'Букле', priceDelta: 0 };

function defaultInput(type: ConfiguratorKey): ConfiguratorInput {
  const config = CONFIGURATOR_TYPES[type];
  return {
    type,
    widthCm: config.widthCm.default,
    depthCm: config.depthCm.default,
    heightCm: config.heightCm.default,
    upholstery: config.usesUpholstery ? boucle : undefined,
    wood: oak,
    finish: oil,
    options: [],
  };
}

describe('calcConfiguratorPrice', () => {
  it.each(Object.keys(CONFIGURATOR_TYPES) as ConfiguratorKey[])('%s в размере по умолчанию стоит базовую цену', (type) => {
    const result = calcConfiguratorPrice(defaultInput(type), DEFAULT_CONFIGURATOR_PRICES);
    expect(result.price).toBe(DEFAULT_CONFIGURATOR_PRICES.basePrices[type]);
    expect(result.days).toBe(CONFIGURATOR_TYPES[type].days);
    expect(result.quantity).toBe(1);
  });

  it('цена растёт вместе с размером: стол в 2 раза уже стоит в 2 раза меньше', () => {
    const result = calcConfiguratorPrice(
      { ...defaultInput('table'), widthCm: 80, wood: walnut, options: ['table-rounded'] },
      DEFAULT_CONFIGURATOR_PRICES,
    );
    // Основа 2700 × 0,5 = 1350; Орех 600 × 0,5 = 300; отделка 0; опция 200
    expect(result.breakdown.map((line) => line.amount)).toEqual([1350, 300, 0, 200]);
    expect(result.price).toBe(1850);
    expect(result.summary).toBe('Стол 80×90×75 см · Орех, Масло-воск · Скруглённые углы');
  });

  it('опции добавляют цену и дни', () => {
    const result = calcConfiguratorPrice(
      { ...defaultInput('sofa'), options: ['sofa-mechanism', 'sofa-pillows'] },
      DEFAULT_CONFIGURATOR_PRICES,
    );
    expect(result.price).toBe(7900 + 1200 + 250);
    expect(result.days).toBe(14 + 3);
  });

  it('округляет вверх до 10 сомони, сумма строк равна цене', () => {
    const result = calcConfiguratorPrice(
      { ...defaultInput('wardrobe'), widthCm: 61, depthCm: 35, heightCm: 150 },
      DEFAULT_CONFIGURATOR_PRICES,
    );
    const sum = result.breakdown.reduce((total, line) => total + line.amount, 0);
    expect(result.price % 10).toBe(0);
    expect(sum).toBe(result.price);
    expect(result.breakdown.at(-1)?.label).toBe('Округление до 10 сомони');
  });

  it('у шкафа в описании есть двери и полки', () => {
    const result = calcConfiguratorPrice(defaultInput('wardrobe'), DEFAULT_CONFIGURATOR_PRICES);
    expect(result.summary).toContain('3 дв., 4 полок');
  });

  it('умножает цену на количество', () => {
    const result = calcConfiguratorPrice({ ...defaultInput('armchair'), quantity: 2 }, DEFAULT_CONFIGURATOR_PRICES);
    expect(result.total).toBe(6400);
  });

  it('использует цены из настроек', () => {
    const prices = {
      ...DEFAULT_CONFIGURATOR_PRICES,
      basePrices: { ...DEFAULT_CONFIGURATOR_PRICES.basePrices, bed: 7000 },
    };
    expect(calcConfiguratorPrice(defaultInput('bed'), prices).price).toBe(7000);
  });

  it('принимает граничные размеры', () => {
    const { widthCm, depthCm, heightCm } = CONFIGURATOR_TYPES.wardrobe;
    const input = defaultInput('wardrobe');
    const smallest = { ...input, widthCm: widthCm.min, depthCm: depthCm.min, heightCm: heightCm.min };
    const largest = { ...input, widthCm: widthCm.max, depthCm: depthCm.max, heightCm: heightCm.max };
    expect(() => calcConfiguratorPrice(smallest, DEFAULT_CONFIGURATOR_PRICES)).not.toThrow();
    expect(() => calcConfiguratorPrice(largest, DEFAULT_CONFIGURATOR_PRICES)).not.toThrow();
  });

  it.each([
    [{ widthCm: 139 }, 'Ширина дивана должна быть целым числом от 140 до 320 см'],
    [{ widthCm: 321 }, 'Ширина дивана'],
    [{ depthCm: 95.5 }, 'Глубина дивана'],
    [{ heightCm: 101 }, 'Высота дивана'],
  ])('отклоняет размер %p', (size, message) => {
    expect(() => calcConfiguratorPrice({ ...defaultInput('sofa'), ...size }, DEFAULT_CONFIGURATOR_PRICES)).toThrow(
      message,
    );
  });

  it('мягкой мебели нужна ткань', () => {
    expect(() =>
      calcConfiguratorPrice({ ...defaultInput('sofa'), upholstery: undefined }, DEFAULT_CONFIGURATOR_PRICES),
    ).toThrow('Выберите ткань обивки');
  });

  it('у шкафа и стола нет ткани', () => {
    expect(() =>
      calcConfiguratorPrice({ ...defaultInput('table'), upholstery: boucle }, DEFAULT_CONFIGURATOR_PRICES),
    ).toThrow(PricingError);
  });

  it.each([[['bed-lift']], [['sofa-mechanism', 'sofa-mechanism']]])('отклоняет чужие и повторные опции %p', (options) => {
    expect(() => calcConfiguratorPrice({ ...defaultInput('sofa'), options }, DEFAULT_CONFIGURATOR_PRICES)).toThrow(
      PricingError,
    );
  });
});

describe('шкаф: двери и полки', () => {
  it.each([
    [60, 2],
    [110, 2],
    [111, 3],
    [300, 6],
  ])('ширина %p см → дверей %p', (widthCm, doors) => {
    expect(defaultWardrobeDoors(widthCm)).toBe(doors);
  });

  it.each([
    [150, 2],
    [239, 4],
    [240, 5],
    [280, 6],
  ])('высота %p см → полок %p', (heightCm, shelves) => {
    expect(wardrobeShelves(heightCm)).toBe(shelves);
  });
});
