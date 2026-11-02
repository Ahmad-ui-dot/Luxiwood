"use client";

import { type ProductListItem } from "@luxiwood/shared";
import { LoaderCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { furnitureTitle } from "@/lib/format";
import { groupDigits } from "../catalog-filters";
import { useT } from "@/lib/i18n";

type Props = {
  product: ProductListItem;
  number: number;
  thumbnail?: string;
  color: { name: string; hex: string };
  wished: boolean;
  onWish: () => void;
  adding: boolean;
  onAddToCart: () => void;
};

// Карточка как на холсте: номер листа, модель с размерной линией, характеристики в три колонки
export function ProductCard({ product, number, thumbnail, color, wished, onWish, adding, onAddToCart }: Props) {
  const t = useT();
  const title = furnitureTitle(product.name);
  const stars = Math.round(product.ratingAvg);
  const badge = product.badge === "HIT" ? t.catalog.flagHit : product.badge === "NEW" ? t.catalog.flagNew : null;

  return (
    <div className="group relative flex h-full min-w-0 flex-col transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2">
      <Link
        href={`/product/${product.slug}`}
        className="flex flex-1 flex-col border border-blueprint/20 bg-[rgb(255_250_243/0.75)] text-foreground transition-colors duration-400 group-hover:border-primary/55"
      >
        <div className="relative aspect-[5/4] overflow-hidden border-b border-blueprint/16">
          <span className="absolute top-3.5 left-3.5 z-[2] text-[13px] text-blueprint transition-colors group-hover:text-primary">
            № {String(number).padStart(2, "0")}
          </span>
          {badge && (
            <span
              className={`absolute top-[34px] left-3.5 z-[2] px-2 py-1 text-xs font-semibold text-background ${
                product.badge === "HIT" ? "bg-primary" : "bg-blueprint"
              }`}
            >
              {badge}
            </span>
          )}
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={`${title} — 3D`}
              className="absolute inset-[4%_6%_10%] size-[88%] object-contain transition-transform duration-600 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.05]"
            />
          ) : (
            <span className="absolute inset-[30%] animate-pulse border border-dashed border-blueprint/25" />
          )}
          <div className="bp-dim right-[16%] bottom-3.5 left-[16%]">
            <i />
            <span>
              {product.widthCm} {t.catalog.cm}
            </span>
            <i />
          </div>
        </div>

        <div className="flex flex-col gap-2 px-[18px] pt-4 pb-[18px]">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-[9px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]" style={{ background: color.hex }} />
            {t.labels.room[product.room]}
            {color.name && ` · ${color.name}`}
          </span>
          <span className="font-heading text-[17px] leading-[1.2] font-normal tracking-[-0.02em]">{title}</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex gap-0.5" aria-label={`${product.ratingAvg.toFixed(1)} / 5`}>
              {[1, 2, 3, 4, 5].map((index) => (
                <svg key={index} width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.4l6.6-.8z"
                    fill={index <= stars ? "#c0612f" : "rgb(120 88 60 / 0.2)"}
                  />
                </svg>
              ))}
            </span>
            {product.reviewsCount > 0 ? `${product.ratingAvg.toFixed(1)} · ${t.product.reviewsLink(product.reviewsCount)}` : t.home.noRating}
          </span>

          <div className="mt-1.5 grid grid-cols-3 border-y border-blueprint/16 text-xs text-dim">
            <span className="flex flex-col gap-[3px] py-2">
              {t.catalog.width}
              <b className="text-xs font-medium text-foreground">
                {product.widthCm} {t.catalog.cm}
              </b>
            </span>
            <span className="flex flex-col gap-[3px] border-l border-blueprint/16 px-2.5 py-2">
              {t.catalog.material}
              <b className="truncate text-xs font-medium text-foreground">{product.kind === "FABRIC" ? t.catalog.fabricKind : t.catalog.woodKind}</b>
            </span>
            <span className="flex flex-col gap-[3px] border-l border-blueprint/16 px-2.5 py-2">
              {t.catalog.term}
              <b className="text-xs font-medium text-foreground">
                {product.productionDays} {t.catalog.daysShort}
              </b>
            </span>
          </div>

          {/* Справа место под кнопку «В корзину» — она лежит поверх, вне ссылки */}
          <div className="mt-1 flex min-h-9 items-center pr-[120px]">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="text-[17px] font-semibold">
                {t.home.from} {groupDigits(product.basePrice)} {t.common.somShort}
              </span>
              {product.oldPrice && <s className="text-xs text-dim">{groupDigits(product.oldPrice)} {t.common.somShort}</s>}
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={onAddToCart}
        disabled={adding}
        aria-label={`${t.cart.toCart}: ${title}`}
        className="lx-gold absolute right-[18px] bottom-[18px] z-[3] flex h-9 cursor-pointer items-center gap-1.5 bg-primary px-3 text-[13px] font-bold text-primary-foreground disabled:opacity-70"
      >
        {adding ? <LoaderCircle className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
        {t.cart.toCart}
      </button>

      <button
        type="button"
        aria-label={`${t.nav.wishlist}: ${title}`}
        aria-pressed={wished}
        onClick={onWish}
        className="absolute top-3 right-3 z-[3] flex size-10 cursor-pointer items-center justify-center border border-blueprint/25 bg-[rgb(255_250_243/0.9)] transition-colors hover:border-primary"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
            fill={wished ? "#c0612f" : "none"}
            stroke="#c0612f"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
