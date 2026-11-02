import {
  calcOrderTotals,
  MODEL3D_LABELS,
  normalizePhone,
  ORDER_STATUS_LABELS,
  orderStatusChangeError,
  OrderStatus,
  PriceLine,
} from '@luxiwood/shared';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pageArgs, paginate, PaginationQueryDto } from '../common/pagination';
import { ConfiguratorService } from '../configurator/configurator.service';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  AdminOrderQueryDto,
  CreateOrderDto,
  OrderItemInputDto,
  TrackOrderQueryDto,
  UpdateOrderDto,
} from './dto/order.dto';

const WITH_DETAILS = {
  items: { orderBy: { id: 'asc' } },
  history: { orderBy: [{ changedAt: 'asc' }, { id: 'asc' }] },
} satisfies Prisma.OrderInclude;

type OrderWithDetails = Prisma.OrderGetPayload<{ include: typeof WITH_DETAILS }>;

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly configurator: ConfiguratorService,
    private readonly settings: SettingsService,
  ) {}

  // ---------- Покупатель ----------

  // Цены, присланные сайтом, не принимаются: сервер всё считает сам
  async create(dto: CreateOrderDto, userId: number | null) {
    const items = [];
    for (const [index, item] of dto.items.entries()) {
      items.push(await this.priceItem(item, index + 1));
    }
    const totals = calcOrderTotals(
      items.map((item) => item.unitPrice * item.quantity),
      await this.settings.getDelivery(),
    );

    const data = {
      userId,
      customerName: dto.customerName,
      phone: normalizePhone(dto.phone)!,
      // Без адреса — пустая строка: мастер уточнит его по телефону и впишет в админке
      address: dto.address ?? '',
      comment: dto.comment || null,
      deliveryDate: dto.deliveryDate ? checkDeliveryDate(dto.deliveryDate) : null,
      payment: dto.payment ?? 'CASH',
      ...totals,
      items: { create: items },
      history: { create: { status: 'NEW' as const, changedBy: userId } },
    };

    // Номер LX-<год>-<4 цифры>. Если два заказа пришли одновременно и номер занят — пробуем следующий
    for (let attempt = 0; ; attempt++) {
      try {
        const order = await this.prisma.order.create({ data: { ...data, number: await this.nextNumber() } });
        return { number: order.number, status: order.status, subtotal: order.subtotal, deliveryPrice: order.deliveryPrice, total: order.total };
      } catch (error) {
        const duplicate = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!duplicate || attempt >= 4) {
          throw error;
        }
      }
    }
  }

  // Без верного телефона заказ не показывается и не подсказывается, существует ли номер
  async track(query: TrackOrderQueryDto) {
    const order = await this.prisma.order.findFirst({
      where: { number: query.number.toUpperCase(), phone: normalizePhone(query.phone) ?? '' },
      include: WITH_DETAILS,
    });
    if (!order) {
      throw new NotFoundException('Заказ не найден. Проверьте номер и телефон');
    }
    const { number, status, statusLabel, deliveryDate, total, items, history, createdAt } = toOrderResponse(order);
    return { number, status, statusLabel, deliveryDate, total, items, history, createdAt };
  }

  async findMine(userId: number, query: PaginationQueryDto) {
    const where = { userId };
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, include: WITH_DETAILS, orderBy: { id: 'desc' }, ...pageArgs(query) }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(orders.map(toOrderResponse), total, query);
  }

  async findMineByNumber(userId: number, number: string) {
    return toOrderResponse(await this.findMineOrFail(userId, number));
  }

  async cancelMine(userId: number, number: string) {
    const order = await this.findMineOrFail(userId, number);
    if (order.status !== 'NEW') {
      throw new ConflictException(
        `Заказ уже на этапе «${ORDER_STATUS_LABELS[order.status]}» — отменить его можно только по телефону мастерской`,
      );
    }
    await this.changeStatus(order.id, 'CANCELLED', userId);
    return this.findMineByNumber(userId, number);
  }

  private async findMineOrFail(userId: number, number: string) {
    const order = await this.prisma.order.findFirst({ where: { userId, number: number.toUpperCase() }, include: WITH_DETAILS });
    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }
    return order;
  }

  // ---------- Администратор ----------

  async findAllForAdmin(query: AdminOrderQueryDto) {
    const search = query.search?.trim();
    const phone = search?.replace(/\s+/g, '');
    const where: Prisma.OrderWhereInput = {
      status: query.status,
      createdAt: {
        gte: query.dateFrom ? new Date(`${query.dateFrom}T00:00:00`) : undefined,
        lt: query.dateTo ? new Date(new Date(`${query.dateTo}T00:00:00`).getTime() + DAY_MS) : undefined,
      },
      OR: search
        ? [
            { number: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: phone } },
          ]
        : undefined,
    };
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { id: 'desc' },
        include: { _count: { select: { items: true } } },
        ...pageArgs(query),
      }),
      this.prisma.order.count({ where }),
    ]);
    const items = orders.map((order) => ({
      id: order.id,
      number: order.number,
      customerName: order.customerName,
      phone: order.phone,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status],
      total: order.total,
      itemsCount: order._count.items,
      deliveryDate: toDateString(order.deliveryDate),
      createdAt: order.createdAt,
    }));
    return paginate(items, total, query);
  }

  async findOneForAdmin(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: WITH_DETAILS });
    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }
    return toAdminOrderResponse(order);
  }

  async updateStatus(id: number, status: OrderStatus, adminId: number) {
    const order = await this.findOneForAdmin(id);
    const error = orderStatusChangeError(order.status, status);
    if (error) {
      throw new BadRequestException(error);
    }
    await this.changeStatus(id, status, adminId);
    return this.findOneForAdmin(id);
  }

  async updateNote(id: number, adminNote: string) {
    await this.findOneForAdmin(id);
    await this.prisma.order.update({ where: { id }, data: { adminNote: adminNote.trim() || null } });
    return this.findOneForAdmin(id);
  }

  async update(id: number, dto: UpdateOrderDto) {
    const order = await this.findOneForAdmin(id);
    if (order.status === 'DONE' || order.status === 'CANCELLED') {
      throw new ConflictException(`Заказ в статусе «${order.statusLabel}» уже нельзя изменить`);
    }
    await this.prisma.order.update({
      where: { id },
      data: {
        customerName: dto.customerName,
        address: dto.address,
        phone: dto.phone ? normalizePhone(dto.phone)! : undefined,
        deliveryDate: dto.deliveryDate === undefined ? undefined : dto.deliveryDate ? checkDeliveryDate(dto.deliveryDate) : null,
      },
    });
    return this.findOneForAdmin(id);
  }

  async remove(id: number) {
    const order = await this.findOneForAdmin(id);
    if (order.status !== 'CANCELLED') {
      throw new ConflictException('Удалить можно только отменённый заказ. Сначала переведите его в статус CANCELLED');
    }
    await this.prisma.order.delete({ where: { id } });
    return { number: order.number, message: 'Заказ удалён' };
  }

  // ---------- Вспомогательное ----------

  private changeStatus(orderId: number, status: OrderStatus, changedBy: number) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status, history: { create: { status, changedBy } } },
    });
  }

  private async nextNumber() {
    const prefix = `LX-${new Date().getFullYear()}-`;
    const last = await this.prisma.order.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: 'desc' } });
    const next = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
    return prefix + String(next).padStart(4, '0');
  }

  // Позиция заказа: проверка выбора и цена — теми же функциями, что и расчёт цены на сайте
  private async priceItem(item: OrderItemInputDto, position: number) {
    const fail = (message: string) => new BadRequestException(`Позиция ${position}: ${message}`);
    if ((item.productId === undefined) === (item.type === undefined)) {
      throw fail('укажите либо productId (товар из каталога), либо type (мебель из конструктора)');
    }

    try {
      if (item.productId !== undefined) {
        if (item.mainMaterialId === undefined) {
          throw fail('укажите mainMaterialId');
        }
        const { product, main, color, wood, size, price } = await this.pricing.priceProduct({
          productId: item.productId,
          mainMaterialId: item.mainMaterialId,
          colorMaterialId: item.colorMaterialId,
          woodMaterialId: item.woodMaterialId,
          sizeId: item.sizeId,
          quantity: item.quantity,
        });
        const title = [product.name, [main.name, color?.name, wood?.name].filter(Boolean).join(', '), size?.label]
          .filter(Boolean)
          .join(' · ');
        return {
          productId: product.id,
          title,
          model3dKey: product.model3dKey,
          mainMaterialId: main.id,
          colorMaterialId: color?.id,
          woodMaterialId: wood?.id,
          sizeId: size?.id,
          quantity: item.quantity,
          unitPrice: price.unitPrice,
          snapshot: {
            kind: 'product',
            sku: product.sku,
            name: product.name,
            mainMaterial: main.name,
            color: color?.name ?? null,
            wood: wood?.name ?? null,
            size: size?.label ?? null,
            breakdown: toJsonLines(price.breakdown),
          },
        };
      }

      const type = item.type!;
      if (item.widthCm === undefined || item.depthCm === undefined || item.heightCm === undefined) {
        throw fail('для конструктора укажите widthCm, depthCm и heightCm');
      }
      if (item.woodMaterialId === undefined || item.finishMaterialId === undefined) {
        throw fail('для конструктора укажите woodMaterialId и finishMaterialId');
      }
      const { price, upholstery, color, wood, finish } = await this.configurator.priceConfigurator({
        type,
        widthCm: item.widthCm,
        depthCm: item.depthCm,
        heightCm: item.heightCm,
        upholsteryMaterialId: item.upholsteryMaterialId,
        colorMaterialId: item.colorMaterialId,
        woodMaterialId: item.woodMaterialId,
        finishMaterialId: item.finishMaterialId,
        options: item.options ?? [],
        quantity: item.quantity,
      });
      return {
        productId: null,
        title: `${MODEL3D_LABELS[type]} на заказ · ${price.summary.split(' · ').slice(0, 2).join(' · ')}`,
        model3dKey: type,
        mainMaterialId: upholstery?.id ?? wood.id,
        colorMaterialId: color?.id,
        woodMaterialId: wood.id,
        finishMaterialId: finish.id,
        customWidthCm: item.widthCm,
        customDepthCm: item.depthCm,
        customHeightCm: item.heightCm,
        options: item.options ?? [],
        quantity: item.quantity,
        unitPrice: price.price,
        snapshot: { kind: 'configurator', summary: price.summary, days: price.days, breakdown: toJsonLines(price.breakdown) },
      };
    } catch (error) {
      // Добавляем номер позиции к понятным ошибкам выбора
      if (error instanceof BadRequestException && !error.message.startsWith('Позиция')) {
        throw fail(error.message.charAt(0).toLowerCase() + error.message.slice(1));
      }
      if (error instanceof NotFoundException) {
        throw fail(error.message.toLowerCase());
      }
      if (error instanceof Error && error.name === 'PricingError') {
        throw fail(error.message.charAt(0).toLowerCase() + error.message.slice(1));
      }
      throw error;
    }
  }
}

// Строки расчёта для JSON-снимка заказа
function toJsonLines(lines: PriceLine[]) {
  return lines.map((line) => ({ label: line.label, amount: line.amount }));
}

// Дата доставки: не раньше завтра и не позже чем через 180 дней
function checkDeliveryDate(value: string): Date {
  const date = new Date(`${value}T00:00:00Z`);
  const today = new Date();
  const tomorrow = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  if (Number.isNaN(date.getTime()) || date.getTime() < tomorrow || date.getTime() > tomorrow + 180 * DAY_MS) {
    throw new BadRequestException('Дата доставки — не раньше завтрашнего дня и не позже чем через 180 дней');
  }
  return date;
}

function toDateString(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : null;
}

export function toOrderResponse(order: OrderWithDetails) {
  return {
    id: order.id,
    number: order.number,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    comment: order.comment,
    deliveryDate: toDateString(order.deliveryDate),
    payment: order.payment,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[order.status],
    subtotal: order.subtotal,
    deliveryPrice: order.deliveryPrice,
    total: order.total,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      title: item.title,
      model3dKey: item.model3dKey,
      options: item.options,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    history: order.history.map((entry) => ({ status: entry.status, label: ORDER_STATUS_LABELS[entry.status], changedAt: entry.changedAt })),
    createdAt: order.createdAt,
  };
}

function toAdminOrderResponse(order: OrderWithDetails) {
  return {
    ...toOrderResponse(order),
    userId: order.userId,
    adminNote: order.adminNote,
    items: order.items.map(({ orderId, ...item }) => item),
    updatedAt: order.updatedAt,
  };
}
