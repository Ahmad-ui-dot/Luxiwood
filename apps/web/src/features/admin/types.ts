// Ответы админских эндпоинтов. Полная схема — в apps/api/openapi.json
import type {
  Badge,
  Category,
  ConfiguratorKey,
  Material,
  MaterialRole,
  Model3dKey,
  OrderStatus,
  Payment,
  PriceLine,
  ProductKind,
  ProductListItem,
  ProductSize,
  PublicSettings,
  Room,
} from "@luxiwood/shared";

export interface MonthCompare {
  current: number;
  previous: number;
  changePercent: number | null;
}

export interface TopProduct {
  productId: number;
  name: string;
  slug: string;
  image: string | null;
  quantity: number;
  revenue: number;
}

export interface Stats {
  monthLabel: string;
  revenue: MonthCompare;
  orders: MonthCompare;
  itemsSold: MonthCompare;
  newClients: MonthCompare;
  averageCheck: number;
  inWork: number;
  newOrders: number;
  rating: { average: number; count: number };
  ordersByStatus: { status: OrderStatus; label: string; count: number }[];
  revenueByDay: { day: number; revenue: number; orders: number }[];
  revenueByMonth: { month: string; label: string; revenue: number; orders: number }[];
  salesByType: { type: Model3dKey; label: string; quantity: number; revenue: number }[];
  topProducts: TopProduct[];
  monthTopProducts: TopProduct[];
  monthPurchases: {
    orderId: number;
    number: string;
    customerName: string;
    status: OrderStatus;
    createdAt: string;
    title: string;
    productId: number | null;
    quantity: number;
    total: number;
  }[];
  lastOrders: { id: number; number: string; customerName: string; status: OrderStatus; total: number; createdAt: string }[];
}

export interface AdminOrderRow {
  id: number;
  number: string;
  customerName: string;
  phone: string;
  status: OrderStatus;
  total: number;
  itemsCount: number;
  deliveryDate: string | null;
  createdAt: string;
}

export interface AdminOrder {
  id: number;
  number: string;
  customerName: string;
  phone: string;
  address: string;
  comment: string | null;
  deliveryDate: string | null;
  payment: Payment;
  status: OrderStatus;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  userId: number | null;
  adminNote: string | null;
  createdAt: string;
  items: {
    id: number;
    productId: number | null;
    title: string;
    quantity: number;
    unitPrice: number;
    snapshot: { summary?: string; days?: number; breakdown?: PriceLine[] } | null;
  }[];
  history: { status: OrderStatus; changedAt: string }[];
}

export interface AdminProductRow extends ProductListItem {
  isActive: boolean;
}

export interface AdminProduct {
  id: number;
  slug: string;
  sku: string;
  name: string;
  description: string;
  categoryId: number;
  basePrice: number;
  oldPrice: number | null;
  kind: ProductKind;
  room: Room;
  badge: Badge;
  widthCm: number;
  materialsText: string;
  productionDays: number;
  model3dKey: Model3dKey;
  modelUrl: string | null;
  images: string[];
  isActive: boolean;
  materials: { materialId: number; role: MaterialRole; isDefault: boolean; material: Material }[];
  sizes: ProductSize[];
}

export interface AdminMaterial extends Material {
  productsCount: number;
}

export interface AdminCategory extends Category {
  productsCount: number;
}

export interface AdminClient {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export interface AdminClientDetails extends AdminClient {
  defaultAddress: string | null;
  orders: AdminOrderRow[];
}

export interface AdminReview {
  id: number;
  rating: number;
  text: string;
  authorName: string;
  createdAt: string;
  isApproved: boolean;
  productId: number;
  productName: string;
}

export interface AdminSettings extends PublicSettings {
  configuratorBasePrices: Record<ConfiguratorKey, number>;
  configuratorOptionPrices: Record<string, number>;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string | null;
  createdAt: string;
}
