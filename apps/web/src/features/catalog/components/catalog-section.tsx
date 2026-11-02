import type { Paginated, ProductListItem } from "@luxiwood/shared";
import { api } from "@/lib/api";
import type { ProductFilters } from "../catalog-filters";
import { CatalogView } from "./catalog-view";
import { getT } from "@/lib/i18n-server";

// Товаров немного, поэтому грузим все сразу и фильтруем в браузере — без ожидания на каждый клик
export async function CatalogSection() {
  const t = await getT();
  const [list, filters] = await Promise.all([
    api<Paginated<ProductListItem>>("/products?sort=popular&limit=100").catch(() => null),
    api<ProductFilters>("/products/filters").catch(() => null),
  ]);

  if (!list || !filters) {
    return <p className="mx-auto max-w-[1280px] px-[max(20px,4vw)] py-32 text-center text-muted-foreground">{t.catalog.loadError}</p>;
  }
  return <CatalogView products={list.items} filters={filters} />;
}
