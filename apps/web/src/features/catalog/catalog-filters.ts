import { type Model3dKey, type ProductListItem, type Room } from "@luxiwood/shared";
import { PREVIEW_COLORS } from "@/features/viewer3d/models";
import { dictionaries } from "@/texts";

// Ответ GET /products/filters
export type ProductFilters = {
  total: number;
  price: { min: number; max: number };
  width: { min: number; max: number };
  days: { min: number; max: number };
  colors: { id: number; name: string; hex: string; type: "COLOR" | "WOOD"; count: number }[];
  rooms: { value: Room; label: string; count: number }[];
  types: { value: Model3dKey; label: string; count: number }[];
  saleCount: number;
};

export type Flag = "sale" | "HIT" | "NEW";
export type Sort = "popular" | "price_asc" | "price_desc" | "new";

export type CatalogFilters = {
  q: string;
  types: Model3dKey[];
  rooms: Room[];
  colorId: number | null;
  fit: number; // FIT_ANY — без ограничения
  price: [number, number];
  maxDays: number; // 0 — любой срок
  flags: Flag[];
  sort: Sort;
};

export const FIT_MIN = 60;
export const FIT_ANY = 300;

export function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

// Границы ползунка бюджета — до сотен
export function priceBounds(filters: ProductFilters): [number, number] {
  return [Math.floor(filters.price.min / 100) * 100, Math.ceil(filters.price.max / 100) * 100];
}

// colorIds — товары, у которых есть выбранный цвет (приходят из API), null — цвет не выбран
export function filterProducts(products: ProductListItem[], state: CatalogFilters, colorIds: number[] | null) {
  const query = state.q.trim().toLowerCase();
  const found = products.filter(
    (product) =>
      // Тип ищем на обоих языках: «диван» и «sofa» найдут одно и то же
      (!query || `${product.name} ${product.sku} ${dictionaries.ru.labels.model[product.model3dKey]} ${dictionaries.en.labels.model[product.model3dKey]}`.toLowerCase().includes(query)) &&
      (state.types.length === 0 || state.types.includes(product.model3dKey)) &&
      (state.rooms.length === 0 || state.rooms.includes(product.room)) &&
      (!colorIds || colorIds.includes(product.id)) &&
      (state.fit >= FIT_ANY || product.widthCm <= state.fit) &&
      product.basePrice >= state.price[0] &&
      product.basePrice <= state.price[1] &&
      (!state.maxDays || product.productionDays <= state.maxDays) &&
      (state.flags.length === 0 || state.flags.some((flag) => (flag === "sale" ? product.oldPrice !== null : product.badge === flag))),
  );

  // «Популярные» — порядок из API, он уже отсортирован по отзывам
  if (state.sort === "price_asc") return found.sort((a, b) => a.basePrice - b.basePrice);
  if (state.sort === "price_desc") return found.sort((a, b) => b.basePrice - a.basePrice);
  if (state.sort === "new") return found.sort((a, b) => b.id - a.id);
  return found;
}

// Цвет карточки: мягкая мебель — один из цветов обивки, корпусная — одна из пород дерева.
// Чтобы витрина была разноцветной, цвет выбирается по ID товара. Если в подборе выбран подходящий цвет — он
export function cardColor(product: ProductListItem, filters: ProductFilters, selectedId: number | null = null) {
  const list = filters.colors.filter((color) => color.type === (product.kind === "FABRIC" ? "COLOR" : "WOOD"));
  const color = list.find((item) => item.id === selectedId) ?? list[product.id % list.length];
  const preview = PREVIEW_COLORS[product.model3dKey];
  if (!color) {
    return { id: undefined, name: "", hex: preview.main, colors: preview };
  }
  return {
    id: color.id,
    name: color.name,
    hex: color.hex,
    colors: product.kind === "FABRIC" ? { main: color.hex, wood: preview.wood } : { main: color.hex, wood: color.hex },
  };
}

// 8900 → «8 900»
export function groupDigits(amount: number) {
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
