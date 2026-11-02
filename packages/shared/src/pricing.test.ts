import { calcDelivery, calcOrderTotals, calcProductPrice, checkFit, FIT_MARGIN_CM, PricingError } from './pricing';

describe('calcProductPrice', () => {
  it('диван по умолчанию стоит базовую цену', () => {
    const result = calcProductPrice({
      basePrice: 8900,
      mainMaterial: { name: 'Букле', priceDelta: 0 },
      size: { name: '210 см', priceDelta: 0 },
      quantity: 1,
    });
    expect(result).toEqual({
      unitPrice: 8900,
      quantity: 1,
      total: 8900,
      breakdown: [
        { label: 'Базовая цена', amount: 8900 },
        { label: 'Материал: Букле', amount: 0 },
        { label: 'Размер: 210 см', amount: 0 },
      ],
    });
  });

  it('складывает все доплаты (ткань, цвет, дерево, размер) и умножает на количество', () => {
    const result = calcProductPrice({
      basePrice: 6500,
      mainMaterial: { name: 'Велюр', priceDelta: 400 },
      colorMaterial: { name: 'Изумруд', priceDelta: 100 },
      woodMaterial: { name: 'Орех', priceDelta: 200 },
      size: { name: '180×200', priceDelta: 1100 },
      quantity: 2,
    });
    expect(result.unitPrice).toBe(8300);
    expect(result.total).toBe(16600);
    expect(result.breakdown.map((line) => line.label)).toEqual([
      'Базовая цена',
      'Материал: Велюр',
      'Цвет: Изумруд',
      'Дерево: Орех',
      'Размер: 180×200',
    ]);
  });

  it('учитывает скидку за меньший размер', () => {
    const result = calcProductPrice({
      basePrice: 8900,
      mainMaterial: { name: 'Букле', priceDelta: 0 },
      size: { name: '190 см', priceDelta: -800 },
      quantity: 1,
    });
    expect(result.unitPrice).toBe(8100);
  });

  it('принимает граничное количество 1 и 99', () => {
    const input = { basePrice: 100, mainMaterial: { name: 'Букле', priceDelta: 0 } };
    expect(calcProductPrice({ ...input, quantity: 1 }).total).toBe(100);
    expect(calcProductPrice({ ...input, quantity: 99 }).total).toBe(9900);
  });

  it.each([0, -1, 1.5, 100])('отклоняет количество %p', (quantity) => {
    expect(() =>
      calcProductPrice({ basePrice: 100, mainMaterial: { name: 'Букле', priceDelta: 0 }, quantity }),
    ).toThrow(PricingError);
  });
});

describe('доставка', () => {
  const settings = { deliveryPrice: 150, freeDeliveryFrom: 5000 };

  it.each([
    [0, 150],
    [4999, 150],
    [5000, 0],
    [12000, 0],
  ])('сумма %p → доставка %p', (subtotal, delivery) => {
    expect(calcDelivery(subtotal, settings)).toBe(delivery);
  });

  it('итог заказа = товары + доставка', () => {
    expect(calcOrderTotals([2900, 1500], settings)).toEqual({ subtotal: 4400, deliveryPrice: 150, total: 4550 });
    expect(calcOrderTotals([8900], settings)).toEqual({ subtotal: 8900, deliveryPrice: 0, total: 8900 });
  });
});

describe('checkFit — «Встанет ли у вас?»', () => {
  it('встанет, если остаётся запас от 20 см', () => {
    expect(checkFit(210, 230)).toEqual({
      fits: true,
      freeCm: FIT_MARGIN_CM,
      verdict: 'Встанет: останется 20 см свободного места',
    });
  });

  it('впритык, если запас меньше 20 см', () => {
    const result = checkFit(210, 215);
    expect(result.fits).toBe(false);
    expect(result.freeCm).toBe(5);
    expect(result.verdict).toMatch(/^Впритык/);
  });

  it('не встанет, если ниша уже мебели', () => {
    expect(checkFit(210, 200)).toEqual({ fits: false, freeCm: -10, verdict: 'Не встанет: не хватает 10 см' });
  });

  it.each([0, -5, 150.5])('отклоняет ширину ниши %p', (niche) => {
    expect(() => checkFit(210, niche)).toThrow(PricingError);
  });
});
