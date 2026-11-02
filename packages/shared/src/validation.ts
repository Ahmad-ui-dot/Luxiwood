// Телефон Таджикистана: +992 и 9 цифр, пробелы допускаются («+992 90 123 45 67»)
export const PHONE_ERROR = 'Неверный формат телефона. Пример: +992 90 123 45 67';

// Возвращает телефон без пробелов (+992901234567) или null, если формат неверный
export function normalizePhone(phone: string): string | null {
  const compact = phone.replace(/\s+/g, '');
  return /^\+992\d{9}$/.test(compact) ? compact : null;
}

export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone) !== null;
}

// Количество одного товара в заказе
export const QUANTITY_LIMITS = { min: 1, max: 99 } as const;

export const PASSWORD_MIN_LENGTH = 6;

// slug: латиница, цифры и дефисы — «divan-orom»
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Цвет: #RRGGBB
export const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
