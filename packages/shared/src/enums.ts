// Значения совпадают с enum в apps/api/prisma/schema.prisma

export const Role = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

// Этапы заказа — как на сайте
export const OrderStatus = {
  NEW: 'NEW',
  FRAME: 'FRAME',
  ASSEMBLY: 'ASSEMBLY',
  UPHOLSTERY: 'UPHOLSTERY',
  DELIVERING: 'DELIVERING',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Принят',
  FRAME: 'Каркас',
  ASSEMBLY: 'Сборка',
  UPHOLSTERY: 'Обивка',
  DELIVERING: 'В пути',
  DONE: 'Доставлен',
  CANCELLED: 'Отменён',
};

// FABRIC — ткань обивки, COLOR — цвет обивки, WOOD — порода дерева, FINISH — покрытие дерева
export const MaterialType = {
  FABRIC: 'FABRIC',
  COLOR: 'COLOR',
  WOOD: 'WOOD',
  FINISH: 'FINISH',
} as const;
export type MaterialType = (typeof MaterialType)[keyof typeof MaterialType];

// Что выбирается у товара как основной материал: ткань или дерево
export const ProductKind = {
  FABRIC: 'FABRIC',
  WOOD: 'WOOD',
} as const;
export type ProductKind = (typeof ProductKind)[keyof typeof ProductKind];

// Роль материала у товара: основной (ткань/дерево по kind), цвет обивки, дерево (ножки, каркас)
export const MaterialRole = {
  MAIN: 'MAIN',
  COLOR: 'COLOR',
  WOOD: 'WOOD',
} as const;
export type MaterialRole = (typeof MaterialRole)[keyof typeof MaterialRole];

export const Model3dKey = {
  SOFA: 'sofa',
  ARMCHAIR: 'armchair',
  BED: 'bed',
  WARDROBE: 'wardrobe',
  TABLE: 'table',
  CHAIR: 'chair',
  DRESSER: 'dresser',
  NIGHTSTAND: 'nightstand',
  SHELF: 'shelf',
  POUF: 'pouf',
  BENCH: 'bench',
} as const;
export type Model3dKey = (typeof Model3dKey)[keyof typeof Model3dKey];

export const MODEL3D_LABELS: Record<Model3dKey, string> = {
  sofa: 'Диван',
  armchair: 'Кресло',
  bed: 'Кровать',
  wardrobe: 'Шкаф',
  table: 'Стол',
  chair: 'Стул',
  dresser: 'Комод',
  nightstand: 'Тумба',
  shelf: 'Стеллаж',
  pouf: 'Пуф',
  bench: 'Скамья',
};

// Типы, которые собираются в конструкторе под свои размеры. Остальные есть только в каталоге
export const CONFIGURATOR_KEYS = ['sofa', 'armchair', 'bed', 'wardrobe', 'table'] as const;
export type ConfiguratorKey = (typeof CONFIGURATOR_KEYS)[number];

// Корпусная мебель — основной материал дерево, без обивки
export const WOOD_MODEL_KEYS: Model3dKey[] = ['wardrobe', 'table', 'dresser', 'nightstand', 'shelf', 'bench'];

export const Room = {
  LIVING: 'LIVING',
  BEDROOM: 'BEDROOM',
  DINING: 'DINING',
  OFFICE: 'OFFICE',
  KIDS: 'KIDS',
  HALLWAY: 'HALLWAY',
} as const;
export type Room = (typeof Room)[keyof typeof Room];

export const ROOM_LABELS: Record<Room, string> = {
  LIVING: 'Гостиная',
  BEDROOM: 'Спальня',
  DINING: 'Столовая',
  OFFICE: 'Кабинет',
  KIDS: 'Детская',
  HALLWAY: 'Прихожая',
};

// Значок на карточке товара
export const Badge = {
  NONE: 'NONE',
  HIT: 'HIT',
  NEW: 'NEW',
} as const;
export type Badge = (typeof Badge)[keyof typeof Badge];

export const Payment = {
  CASH: 'CASH',
  CARD: 'CARD',
} as const;
export type Payment = (typeof Payment)[keyof typeof Payment];
