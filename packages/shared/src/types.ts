// Типы ответов API для сайта. Даты приходят строками в формате ISO.
// Полная схема всех ответов (включая админку) — в apps/api/openapi.json.
import type { Badge, MaterialType, Model3dKey, OrderStatus, Payment, ProductKind, Role, Room } from './enums';
import type { ConfiguratorOption, ConfiguratorType } from './configurator';
import type { PriceLine } from './pricing';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  defaultAddress: string | null;
  createdAt: string;
}

export interface AuthToken {
  accessToken: string;
  user: User;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface Material {
  id: number;
  type: MaterialType;
  name: string;
  hex: string;
  priceDelta: number;
  isActive: boolean;
}

export interface ProductSize {
  id: number;
  label: string;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  priceDelta: number;
  isDefault: boolean;
}

export interface ProductListItem {
  id: number;
  slug: string;
  sku: string;
  name: string;
  basePrice: number;
  oldPrice: number | null;
  kind: ProductKind;
  room: Room;
  badge: Badge;
  widthCm: number;
  model3dKey: Model3dKey;
  images: string[];
  productionDays: number;
  ratingAvg: number;
  reviewsCount: number;
  category: Category;
}

export interface ProductDetails extends ProductListItem {
  description: string;
  materialsText: string;
  modelUrl: string | null;
  mainMaterials: Material[];
  colorMaterials: Material[];
  woodMaterials: Material[];
  sizes: ProductSize[];
  defaults: {
    mainMaterialId: number | null;
    colorMaterialId: number | null;
    woodMaterialId: number | null;
    sizeId: number | null;
  };
}

export interface Quote {
  unitPrice: number;
  quantity: number;
  total: number;
  breakdown: PriceLine[];
}

// GET /configurator/options: пределы размеров, материалы и опции с ценами для каждого типа
export interface ConfiguratorTypeOptions extends Omit<ConfiguratorType, 'genitive' | 'options'> {
  basePrice: number;
  fabrics: Material[];
  colors: Material[];
  woods: Material[];
  finishes: Material[];
  options: (ConfiguratorOption & { price: number })[];
}

export interface ConfiguratorOptions {
  types: ConfiguratorTypeOptions[];
}

export interface ConfiguratorQuote {
  price: number;
  quantity: number;
  total: number;
  days: number;
  summary: string;
  breakdown: PriceLine[];
}

export interface OrderCreated {
  number: string;
  status: OrderStatus;
  subtotal: number;
  deliveryPrice: number;
  total: number;
}

export interface OrderItem {
  id: number;
  productId: number | null;
  title: string;
  model3dKey: Model3dKey;
  options: string[];
  quantity: number;
  unitPrice: number;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  changedAt: string;
}

export interface Order {
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
  items: OrderItem[];
  history: OrderHistoryEntry[];
  createdAt: string;
}

export interface PublicSettings {
  deliveryPrice: number;
  freeDeliveryFrom: number;
  workshopPhone: string;
  workshopHours: string;
}
