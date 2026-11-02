import { Model3dKey, MODEL3D_LABELS, ORDER_STATUS_LABELS, OrderStatus } from '@luxiwood/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const TOP_LIMIT = 10;
const PURCHASES_LIMIT = 50;

type SoldItem = {
  productId: number | null;
  model3dKey: Model3dKey;
  quantity: number;
  unitPrice: number;
  product: { name: string; slug: string; images: string[] } | null;
};

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  // Обзор для главной страницы админки. Отменённые заказы в выручку и продажи не входят
  async overview() {
    const now = new Date();
    const monthStart = (shift: number) => new Date(now.getFullYear(), now.getMonth() + shift, 1);
    const sixMonthsAgo = monthStart(-5);
    const notCancelled = { status: { not: 'CANCELLED' as const } };

    const [orders, items, statusGroups, lastOrders, clientsNow, clientsBefore, reviews] = await Promise.all([
      this.prisma.order.findMany({ where: { createdAt: { gte: sixMonthsAgo }, ...notCancelled }, select: { total: true, createdAt: true } }),
      this.prisma.orderItem.findMany({
        where: { order: notCancelled },
        select: {
          productId: true,
          title: true,
          model3dKey: true,
          quantity: true,
          unitPrice: true,
          product: { select: { name: true, slug: true, images: true } },
          order: { select: { id: true, number: true, customerName: true, status: true, createdAt: true } },
        },
        orderBy: { order: { createdAt: 'desc' } },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.findMany({ orderBy: { id: 'desc' }, take: 5 }),
      this.prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: monthStart(0) } } }),
      this.prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: monthStart(-1), lt: monthStart(0) } } }),
      this.prisma.review.aggregate({ where: { isApproved: true }, _avg: { rating: true }, _count: { _all: true } }),
    ]);

    const between = (date: Date, shift: number) => date >= monthStart(shift) && date < monthStart(shift + 1);
    const inMonth = (shift: number) => orders.filter((order) => between(order.createdAt, shift));
    const sum = (list: { total: number }[]) => list.reduce((total, order) => total + order.total, 0);
    const pieces = (list: { quantity: number }[]) => list.reduce((total, item) => total + item.quantity, 0);
    const current = inMonth(0);
    const previous = inMonth(-1);
    const monthItems = items.filter((item) => between(item.order.createdAt, 0));
    const statusCount = (status: OrderStatus) => statusGroups.find((group) => group.status === status)?._count._all ?? 0;

    // Продажи по типам мебели — за всё время
    const byType = new Map<Model3dKey, { quantity: number; revenue: number }>();
    for (const item of items) {
      const type = byType.get(item.model3dKey) ?? { quantity: 0, revenue: 0 };
      byType.set(item.model3dKey, { quantity: type.quantity + item.quantity, revenue: type.revenue + item.unitPrice * item.quantity });
    }

    // Выручка по дням текущего месяца: с 1-го числа до сегодня
    const revenueByDay = Array.from({ length: now.getDate() }, (_, index) => {
      const day = index + 1;
      const list = current.filter((order) => order.createdAt.getDate() === day);
      return { day, revenue: sum(list), orders: list.length };
    });

    return {
      monthLabel: `${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`,
      revenue: compare(sum(current), sum(previous)),
      orders: compare(current.length, previous.length),
      itemsSold: compare(pieces(monthItems), pieces(items.filter((item) => between(item.order.createdAt, -1)))),
      newClients: compare(clientsNow, clientsBefore),
      averageCheck: current.length > 0 ? Math.round(sum(current) / current.length) : 0,
      inWork: statusCount('FRAME') + statusCount('ASSEMBLY') + statusCount('UPHOLSTERY') + statusCount('DELIVERING'),
      newOrders: statusCount('NEW'),
      rating: { average: Math.round((reviews._avg.rating ?? 0) * 10) / 10, count: reviews._count._all },
      ordersByStatus: (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => ({ status, label: ORDER_STATUS_LABELS[status], count: statusCount(status) })),
      revenueByDay,
      revenueByMonth: [-5, -4, -3, -2, -1, 0].map((shift) => {
        const start = monthStart(shift);
        const list = inMonth(shift);
        return {
          month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
          label: MONTHS[start.getMonth()],
          revenue: sum(list),
          orders: list.length,
        };
      }),
      salesByType: [...byType.entries()]
        .map(([type, value]) => ({ type, label: MODEL3D_LABELS[type], ...value }))
        .sort((a, b) => b.revenue - a.revenue),
      topProducts: ranking(items),
      monthTopProducts: ranking(monthItems),
      monthPurchases: monthItems.slice(0, PURCHASES_LIMIT).map((item) => ({
        orderId: item.order.id,
        number: item.order.number,
        customerName: item.order.customerName,
        status: item.order.status,
        createdAt: item.order.createdAt,
        title: item.title,
        productId: item.productId,
        quantity: item.quantity,
        total: item.unitPrice * item.quantity,
      })),
      lastOrders: lastOrders.map((order) => ({
        id: order.id,
        number: order.number,
        customerName: order.customerName,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status],
        total: order.total,
        createdAt: order.createdAt,
      })),
    };
  }
}

// Текущий месяц, прошлый и разница в процентах (null — в прошлом месяце было 0)
function compare(current: number, previous: number) {
  return { current, previous, changePercent: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null };
}

// Рейтинг продаж: товары по числу проданных штук, при равенстве — по выручке. Мебель из конструктора не входит
function ranking(items: SoldItem[]) {
  const byProduct = new Map<number, { productId: number; name: string; slug: string; image: string | null; quantity: number; revenue: number }>();
  for (const item of items) {
    if (!item.productId || !item.product) continue;
    const product = byProduct.get(item.productId) ?? {
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0] ?? null,
      quantity: 0,
      revenue: 0,
    };
    byProduct.set(item.productId, { ...product, quantity: product.quantity + item.quantity, revenue: product.revenue + item.unitPrice * item.quantity });
  }
  return [...byProduct.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, TOP_LIMIT);
}
