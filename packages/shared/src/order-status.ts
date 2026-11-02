import { ORDER_STATUS_LABELS, OrderStatus } from './enums';

// Порядок этапов. Заказ двигается только вперёд (этап можно пропустить, например «Обивку» у стола)
export const ORDER_STATUS_FLOW: OrderStatus[] = ['NEW', 'FRAME', 'ASSEMBLY', 'UPHOLSTERY', 'DELIVERING', 'DONE'];

// Из этих статусов перейти уже нельзя
export const FINAL_ORDER_STATUSES: OrderStatus[] = ['DONE', 'CANCELLED'];

// Возвращает текст ошибки или null, если переход разрешён
export function orderStatusChangeError(from: OrderStatus, to: OrderStatus): string | null {
  if (from === to) {
    return `Заказ уже на этапе «${ORDER_STATUS_LABELS[to]}»`;
  }
  if (FINAL_ORDER_STATUSES.includes(from)) {
    return `Заказ в статусе «${ORDER_STATUS_LABELS[from]}» больше нельзя менять`;
  }
  if (to === 'CANCELLED') {
    return null;
  }
  if (ORDER_STATUS_FLOW.indexOf(to) < ORDER_STATUS_FLOW.indexOf(from)) {
    return `Нельзя вернуть заказ с этапа «${ORDER_STATUS_LABELS[from]}» на этап «${ORDER_STATUS_LABELS[to]}»`;
  }
  return null;
}
