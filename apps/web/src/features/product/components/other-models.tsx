"use client";

import type { Paginated, ProductDetails, ProductListItem } from "@luxiwood/shared";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PREVIEW_COLORS } from "@/features/viewer3d/models";
import { useThumbnails } from "@/features/viewer3d/use-thumbnails";
import { api } from "@/lib/api";
import { furnitureTitle } from "@/lib/format";
import { useT } from "@/lib/i18n";

// Полоса под 3D: по одной популярной модели других типов, по клику — их страница.
// Модели одного типа на превью выглядят одинаково, поэтому показываем разные типы
export function OtherModels({ product }: { product: ProductDetails }) {
  const t = useT();
  const [others, setOthers] = useState<ProductListItem[]>([]);

  useEffect(() => {
    api<Paginated<ProductListItem>>("/products?sort=popular&limit=100")
      .then((data) => {
        const picked: ProductListItem[] = [];
        for (const item of data.items) {
          if (item.model3dKey !== product.model3dKey && !picked.some((other) => other.model3dKey === item.model3dKey)) {
            picked.push(item);
          }
        }
        setOthers(picked.slice(0, 5));
      })
      .catch(() => {});
  }, [product.model3dKey]);

  const thumbnails = useThumbnails(
    useMemo(() => others.map((item) => ({ key: item.slug, type: item.model3dKey, colors: PREVIEW_COLORS[item.model3dKey] })), [others]),
  );

  if (others.length === 0) return null;

  return (
    <div role="group" aria-label={t.product.others} className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {others.map((item) => (
        <Link
          key={item.id}
          href={`/product/${item.slug}`}
          aria-label={furnitureTitle(item.name)}
          title={furnitureTitle(item.name)}
          className="relative aspect-square overflow-hidden rounded-xl border border-blueprint/20 bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,#f7efe3_0%,#fffaf3_70%)] transition-[border-color,transform] duration-300 hover:-translate-y-[3px] hover:border-primary"
        >
          {thumbnails[item.slug] && <img src={thumbnails[item.slug]} alt="" className="absolute inset-0 size-full object-contain" />}
        </Link>
      ))}
    </div>
  );
}
