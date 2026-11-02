"use client";

import { type ProductListItem } from "@luxiwood/shared";
import Link from "next/link";
import { useMemo } from "react";
import { PREVIEW_COLORS } from "@/features/viewer3d/models";
import { useThumbnails } from "@/features/viewer3d/use-thumbnails";
import { useWishlist } from "@/lib/use-wishlist";
import { useT } from "@/lib/i18n";

export function CollectionGrid({ products }: { products: ProductListItem[] }) {
  const t = useT();
  const { wished, toggleWish } = useWishlist();

  const thumbnails = useThumbnails(
    useMemo(
      () => products.map((product) => ({ key: product.slug, type: product.model3dKey, colors: PREVIEW_COLORS[product.model3dKey] })),
      [products],
    ),
  );

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
      {products.map((product) => {
        const isWished = wished.includes(product.id);
        const stars = Math.round(product.ratingAvg);
        const thumbnail = thumbnails[product.slug];
        return (
          <div key={product.id} className="group relative flex flex-col transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2">
            <Link
              href={`/product/${product.slug}`}
              className="bp-frame flex flex-1 flex-col overflow-hidden rounded-xl border border-[rgb(90_62_40/0.1)] bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,#f7efe3_0%,#fffaf3_70%)] text-foreground transition-colors duration-400 group-hover:border-primary/55"
            >
              <div className="relative aspect-square">
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt={`${t.labels.model[product.model3dKey]} — 3D`}
                    className="absolute inset-0 size-full object-contain transition-transform duration-600 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.04]"
                  />
                )}
                <span className="absolute top-4 left-4 rounded-xl border border-primary/50 px-3 py-1.5 text-[13px] font-bold text-primary">3D</span>
              </div>

              <div className="flex flex-col gap-1.5 px-[22px] pt-1 pb-6">
                <span className="text-[13px] font-semibold text-muted-foreground">{t.labels.room[product.room]}</span>
                {/* Как на холсте: только тип мебели, без названия модели */}
                <span className="font-heading text-xl leading-[1.12] font-normal tracking-[-0.02em]">{t.labels.model[product.model3dKey]}</span>
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="flex gap-0.5" aria-label={`${product.ratingAvg.toFixed(1)} / 5`}>
                    {[1, 2, 3, 4, 5].map((index) => (
                      <svg key={index} width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.4l6.6-.8z"
                          fill={index <= stars ? "#c0612f" : "rgb(120 88 60 / 0.2)"}
                        />
                      </svg>
                    ))}
                  </span>
                  <span>
                    {product.reviewsCount > 0
                      ? `${product.ratingAvg.toFixed(1)} · ${t.product.reviewsLink(product.reviewsCount)}`
                      : t.home.noRating}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-[rgb(90_62_40/0.1)] pt-3.5">
                  <span className="text-[15px] font-semibold">{t.home.from} {t.price(product.basePrice)}</span>
                  <span className="text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                    {t.home.in3d}
                  </span>
                </div>
              </div>
            </Link>

            <button
              type="button"
              aria-label={`${t.nav.wishlist}: ${t.labels.model[product.model3dKey]}`}
              aria-pressed={isWished}
              onClick={() => toggleWish(product)}
              className="absolute top-3.5 right-3.5 z-[3] flex size-11 cursor-pointer items-center justify-center rounded-xl border border-[rgb(90_62_40/0.2)] bg-[rgb(255_250_243/0.55)] p-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
                  fill={isWished ? "#c0612f" : "none"}
                  stroke="#c0612f"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
