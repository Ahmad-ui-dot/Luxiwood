// Формулы цены. Используются и сервером (он всегда пересчитывает цену сам),
// и сайтом (чтобы показать цену мгновенно). Без Prisma и Nest — только чистые функции.
import { QUANTITY_LIMITS } from './validation';

// Ошибка во входных данных расчёта. Сообщение показывается покупателю.
export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingError';
  }
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PricedOption {
  name: string;
  priceDelta: number;
}

// ---------- Цена товара ----------

export interface ProductPriceInput {
  basePrice: number;
  mainMaterial: PricedOption;
  colorMaterial?: PricedOption;
  woodMaterial?: PricedOption;
  size?: PricedOption;
  quantity: number;
}

export interface ProductPrice {
  unitPrice: number;
  quantity: number;
  total: number;
  breakdown: PriceLine[];
}

// Цена за штуку = база + доплаты за материал, цвет, дерево и размер. Итого = цена × количество
export function calcProductPrice(input: ProductPriceInput): ProductPrice {
  checkQuantity(input.quantity);

  const breakdown: PriceLine[] = [
    { label: 'Базовая цена', amount: input.basePrice },
    { label: `Материал: ${input.mainMaterial.name}`, amount: input.mainMaterial.priceDelta },
  ];
  if (input.colorMaterial) {
    breakdown.push({ label: `Цвет: ${input.colorMaterial.name}`, amount: input.colorMaterial.priceDelta });
  }
  if (input.woodMaterial) {
    breakdown.push({ label: `Дерево: ${input.woodMaterial.name}`, amount: input.woodMaterial.priceDelta });
  }
  if (input.size) {
    breakdown.push({ label: `Размер: ${input.size.name}`, amount: input.size.priceDelta });
  }

  const unitPrice = sumLines(breakdown);
  return { unitPrice, quantity: input.quantity, total: unitPrice * input.quantity, breakdown };
}

// ---------- Доставка ----------

export interface DeliverySettings {
  deliveryPrice: number; // доставка по Душанбе
  freeDeliveryFrom: number; // от этой суммы товаров доставка бесплатная
}

export function calcDelivery(subtotal: number, settings: DeliverySettings): number {
  return subtotal >= settings.freeDeliveryFrom ? 0 : settings.deliveryPrice;
}

export interface OrderTotals {
  subtotal: number;
  deliveryPrice: number;
  total: number;
}

// Итог заказа по суммам позиций
export function calcOrderTotals(itemTotals: number[], settings: DeliverySettings): OrderTotals {
  const subtotal = itemTotals.reduce((total, amount) => total + amount, 0);
  const deliveryPrice = calcDelivery(subtotal, settings);
  return { subtotal, deliveryPrice, total: subtotal + deliveryPrice };
}

// ---------- «Встанет ли у вас?» ----------

// Сколько сантиметров оставить по ширине на проход и монтаж
export const FIT_MARGIN_CM = 20;

export interface FitResult {
  fits: boolean;
  freeCm: number;
  verdict: string;
}

export function checkFit(furnitureWidthCm: number, nicheWidthCm: number): FitResult {
  if (!Number.isInteger(nicheWidthCm) || nicheWidthCm < 1) {
    throw new PricingError('Ширина ниши должна быть целым числом сантиметров');
  }
  const freeCm = nicheWidthCm - furnitureWidthCm;
  if (freeCm < 0) {
    return { fits: false, freeCm, verdict: `Не встанет: не хватает ${-freeCm} см` };
  }
  if (freeCm < FIT_MARGIN_CM) {
    return {
      fits: false,
      freeCm,
      verdict: `Впритык: останется ${freeCm} см, а нужно хотя бы ${FIT_MARGIN_CM} см на проход и монтаж`,
    };
  }
  return { fits: true, freeCm, verdict: `Встанет: останется ${freeCm} см свободного места` };
}

// ---------- Вспомогательное ----------

export function sumLines(lines: PriceLine[]): number {
  return lines.reduce((total, line) => total + line.amount, 0);
}

export function checkQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < QUANTITY_LIMITS.min || quantity > QUANTITY_LIMITS.max) {
    throw new PricingError(`Количество должно быть целым числом от ${QUANTITY_LIMITS.min} до ${QUANTITY_LIMITS.max}`);
  }
}
