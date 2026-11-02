import { Transform } from 'class-transformer';

// ?sale=true / ?isActive=false из строки запроса → boolean. Другие значения остаются строкой и не проходят @IsBoolean
export function ToBoolean() {
  return Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value));
}

// Убирает пробелы по краям строки
export function Trim() {
  return Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
}
