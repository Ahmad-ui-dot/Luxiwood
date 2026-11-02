import { OrderStatus } from './enums';
import { orderStatusChangeError } from './order-status';

describe('orderStatusChangeError', () => {
  it.each<[OrderStatus, OrderStatus]>([
    ['NEW', 'FRAME'],
    ['FRAME', 'ASSEMBLY'],
    ['ASSEMBLY', 'DELIVERING'], // у стола нет обивки — этап пропускается
    ['DELIVERING', 'DONE'],
    ['NEW', 'CANCELLED'],
    ['UPHOLSTERY', 'CANCELLED'],
  ])('разрешает %s → %s', (from, to) => {
    expect(orderStatusChangeError(from, to)).toBeNull();
  });

  it.each<[OrderStatus, OrderStatus, string]>([
    ['DONE', 'NEW', 'Заказ в статусе «Доставлен» больше нельзя менять'],
    ['CANCELLED', 'FRAME', 'Заказ в статусе «Отменён» больше нельзя менять'],
    ['ASSEMBLY', 'FRAME', 'Нельзя вернуть заказ с этапа «Сборка» на этап «Каркас»'],
    ['FRAME', 'FRAME', 'Заказ уже на этапе «Каркас»'],
  ])('запрещает %s → %s', (from, to, message) => {
    expect(orderStatusChangeError(from, to)).toBe(message);
  });
});
