import type { Model3dKey, Paginated, ProductListItem } from "@luxiwood/shared";
import Link from "next/link";
import { api } from "@/lib/api";
import { CollectionGrid } from "./collection-grid";
import { getT } from "@/lib/i18n-server";

const ORDER: Model3dKey[] = ["sofa", "armchair", "bed", "wardrobe", "table"];

// По одному предмету каждого типа: диван, кресло, кровать, шкаф, стол
async function getCollection() {
  const data = await api<Paginated<ProductListItem>>("/products?sort=popular&limit=50").catch(() => null);
  if (!data) {
    return null;
  }
  return ORDER.map((type) => data.items.find((product) => product.model3dKey === type)).filter((product) => product !== undefined);
}

export async function CollectionSection() {
  const t = await getT();
  const products = await getCollection();

  return (
    <section className="px-[max(20px,4vw)] pt-[120px] pb-[60px]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3.5">
            <p className="text-xs font-semibold text-primary">{t.home.colEyebrow}</p>
            <h2 className="font-heading text-[clamp(25px,2.73vw,42px)] leading-[1.12] font-normal tracking-[-0.02em]">
              {t.home.colA}
              <span className="font-light text-soft">{t.home.colI}</span>
            </h2>
          </div>
          <Link href="/catalog" className="text-[13px] font-semibold text-primary transition-colors hover:text-foreground">
            {t.home.allCatalog}
          </Link>
        </div>

        {products ? <CollectionGrid products={products} /> : <p className="text-muted-foreground">{t.home.emptyState}</p>}
      </div>
    </section>
  );
}
