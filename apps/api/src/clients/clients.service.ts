import { ORDER_STATUS_LABELS } from '@luxiwood/shared';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Order, Prisma, User } from '@prisma/client';
import { pageArgs, paginate } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { ClientQueryDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ClientQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      role: 'CLIENT',
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search.replace(/\s+/g, '') } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
      orders: query.hasOrders === 'true' ? { some: {} } : query.hasOrders === 'false' ? { none: {} } : undefined,
    };

    // Сумма покупок считается из заказов, поэтому для такой сортировки берём всех подходящих и делим на страницы здесь
    if (query.sort === 'spent') {
      const users = await this.prisma.user.findMany({ where, include: { orders: true } });
      const clients = users.map(toClient).sort((a, b) => b.totalSpent - a.totalSpent || b.ordersCount - a.ordersCount);
      const { skip, take } = pageArgs(query);
      return paginate(clients.slice(skip, skip + take), clients.length, query);
    }

    const orderBy: Prisma.UserOrderByWithRelationInput[] = query.sort === 'orders' ? [{ orders: { _count: 'desc' } }, { id: 'desc' }] : [{ id: 'desc' }];
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, include: { orders: true }, orderBy, ...pageArgs(query) }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(users.map(toClient), total, query);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: 'CLIENT' },
      include: { orders: { orderBy: { id: 'desc' }, include: { _count: { select: { items: true } } } } },
    });
    if (!user) {
      throw new NotFoundException('Клиент не найден');
    }
    return {
      ...toClient(user),
      defaultAddress: user.defaultAddress,
      orders: user.orders.map((order) => ({
        id: order.id,
        number: order.number,
        customerName: order.customerName,
        phone: order.phone,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status],
        total: order.total,
        itemsCount: order._count.items,
        deliveryDate: order.deliveryDate ? order.deliveryDate.toISOString().slice(0, 10) : null,
        createdAt: order.createdAt,
      })),
    };
  }
}

// Сумма покупок — без отменённых заказов
function toClient(user: User & { orders: Order[] }) {
  const paid = user.orders.filter((order) => order.status !== 'CANCELLED');
  const last = user.orders.reduce<Date | null>((latest, order) => (!latest || order.createdAt > latest ? order.createdAt : latest), null);
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    ordersCount: user.orders.length,
    totalSpent: paid.reduce((sum, order) => sum + order.total, 0),
    lastOrderAt: last,
    createdAt: user.createdAt,
  };
}
