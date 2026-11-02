"use client";

import { type Model3dKey, type Paginated, type ProductListItem, type Room } from "@luxiwood/shared";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PREVIEW_COLORS } from "@/features/viewer3d/models";
import { useThumbnails } from "@/features/viewer3d/use-thumbnails";
import { api } from "@/lib/api";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useWishlist } from "@/lib/use-wishlist";
import { cn } from "@/lib/utils";
import {
  type CatalogFilters,
  cardColor,
  filterProducts,
  FIT_ANY,
  groupDigits,
  priceBounds,
  type ProductFilters,
  type Sort,
} from "../catalog-filters";
import { FilterDeck } from "./filter-deck";
import { ProductCard } from "./product-card";
import { useT } from "@/lib/i18n";

type Props = { products: ProductListItem[]; filters: ProductFilters };

export function CatalogView({ products, filters }: Props) {
  const t = useT();
  const searchParams = useSearchParams();
  const { wished, toggleWish } = useWishlist();
  const { addToCart, addingId } = useAddToCart();
  const bounds = priceBounds(filters);

  const empty: CatalogFilters = { q: "", types: [], rooms: [], colorId: null, fit: FIT_ANY, price: bounds, maxDays: 0, flags: [], sort: "popular" };
  // Ссылки из подвала и главной ведут сюда с ?room=LIVING или ?type=sofa
  const [state, setState] = useState<CatalogFilters>(() => {
    const room = searchParams.get("room");
    const type = searchParams.get("type");
    return {
      ...empty,
      rooms: room && room in t.labels.room ? [room as Room] : [],
      types: type && type in t.labels.model ? [type as Model3dKey] : [],
    };
  });
  const update = (patch: Partial<CatalogFilters>) => setState((current) => ({ ...current, ...patch }));

  // Цвета у товара в списке нет — какие товары бывают в выбранном цвете, спрашиваем у API
  const [colorIds, setColorIds] = useState<number[] | null>(null);
  useEffect(() => {
    if (state.colorId === null) {
      setColorIds(null);
      return;
    }
    let active = true;
    api<Paginated<ProductListItem>>(`/products?color=${state.colorId}&limit=100`)
      .then((data) => active && setColorIds(data.items.map((product) => product.id)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [state.colorId]);

  const found = filterProducts(products, state, colorIds);

  // Превью: по одному на тип для панели «Тип мебели» и по одному на товар в его цвете
  const thumbnails = useThumbnails(
    useMemo(
      () => [
        ...filters.types.map((type) => ({ key: `type:${type.value}`, type: type.value, colors: PREVIEW_COLORS[type.value] })),
        ...products.map((product) => {
          const color = cardColor(product, filters, state.colorId);
          return { key: `${product.slug}:${color.hex}`, type: product.model3dKey, colors: color.colors };
        }),
      ],
      [products, filters, state.colorId],
    ),
  );

  // Выбранные фильтры — плашками над результатами, каждую можно убрать
  const color = filters.colors.find((item) => item.id === state.colorId);
  const chips = [
    ...(state.q.trim() ? [{ label: `«${state.q.trim()}»`, remove: () => update({ q: "" }) }] : []),
    ...state.types.map((type) => ({ label: t.labels.model[type], remove: () => update({ types: state.types.filter((item) => item !== type) }) })),
    ...(color ? [{ label: color.name, remove: () => update({ colorId: null }) }] : []),
    ...(state.fit < FIT_ANY ? [{ label: `≤ ${state.fit} ${t.catalog.cm}`, remove: () => update({ fit: FIT_ANY }) }] : []),
    ...(state.price[0] !== bounds[0] || state.price[1] !== bounds[1]
      ? [{ label: `${groupDigits(state.price[0])}–${groupDigits(state.price[1])} ${t.common.somShort}`, remove: () => update({ price: bounds }) }]
      : []),
    ...state.rooms.map((room) => ({ label: t.labels.room[room], remove: () => update({ rooms: state.rooms.filter((item) => item !== room) }) })),
    ...(state.maxDays ? [{ label: `≤ ${state.maxDays} ${t.catalog.daysShort}`, remove: () => update({ maxDays: 0 }) }] : []),
    ...state.flags.map((flag) => ({
      label: flag === "sale" ? t.catalog.flagSale : flag === "HIT" ? t.catalog.flagHit : t.catalog.flagNew,
      remove: () => update({ flags: state.flags.filter((item) => item !== flag) }),
    })),
  ];
  const resetAll = () => setState({ ...empty, sort: state.sort });

  return (
    <div className="px-[max(20px,4vw)] pb-[110px]">
      <div className="mx-auto max-w-[1280px]">
        <section aria-labelledby="catalog-title" className="flex flex-wrap items-end justify-between gap-7 border-b border-blueprint/22 pt-11 pb-[34px]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <p className="flex items-center gap-2.5 text-[13px] font-medium text-blueprint">
              <Link href="/" className="transition-colors hover:text-foreground">
                {t.nav.home}
              </Link>
              / {t.catalog.title}
            </p>
            <h1 id="catalog-title" className="font-heading text-[clamp(40px,5.4vw,84px)] leading-[.98] font-normal tracking-[-0.045em]">
              {t.catalog.title}
              <sup className="ml-2.5 align-top text-sm text-primary">
                {found.length}/{products.length}
              </sup>
            </h1>
            <p className="max-w-[520px] text-base leading-[1.6] font-light text-soft">{t.catalog.sub}</p>
          </div>

          <form role="search" onSubmit={(event) => event.preventDefault()} className="min-w-[260px] flex-[0_1_460px]">
            <label htmlFor="catalog-search" className="mb-2.5 block text-[13px] font-medium text-blueprint">
              {t.catalog.findLabel}
            </label>
            <div className="flex h-[58px] items-center gap-3 border border-blueprint/35 bg-[rgb(255_250_243/0.8)] px-[18px] transition-colors focus-within:border-primary">
              <span aria-hidden="true" className="text-[15px] text-primary">
                ›
              </span>
              <input
                id="catalog-search"
                type="search"
                autoComplete="off"
                value={state.q}
                onChange={(event) => update({ q: event.target.value })}
                placeholder={t.catalog.searchPlaceholder}
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-dim"
              />
              {state.q && (
                <button type="button" onClick={() => update({ q: "" })} aria-label={t.catalog.clearSearch} className="cursor-pointer text-lg text-muted-foreground hover:text-foreground">
                  ×
                </button>
              )}
            </div>
          </form>
        </section>

        <section aria-label={t.catalog.deck} className="flex flex-col gap-3.5 pt-7 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-2.5 text-[13px] font-medium text-blueprint">
              <b className="font-medium text-primary">◆</b>
              {t.catalog.deck} · {t.catalog.deckSub}
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="h-9 cursor-pointer border border-blueprint/30 px-3.5 text-[13px] text-soft transition-colors hover:border-primary hover:text-primary"
            >
              ↺ {t.catalog.reset}
              {chips.length > 0 && ` · ${chips.length}`}
            </button>
          </div>
          <FilterDeck state={state} update={update} products={products} filters={filters} typeImages={thumbnails} />
        </section>

        <section aria-label={t.catalog.title} className="flex flex-col gap-[22px] pt-[26px]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blueprint/22 pb-3.5">
            <p aria-live="polite" className="flex items-baseline gap-3">
              <span className="font-heading text-[34px] tracking-[-0.03em]">{found.length}</span>
              <span className="text-xs text-muted-foreground">{t.common.modelsWord(found.length)}</span>
            </p>
            <div role="group" aria-label={t.catalog.sortLabel} className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] font-medium text-blueprint">{t.catalog.sortLabel}</span>
              <span className="flex flex-wrap border border-blueprint/30">
                {t.catalog.sorts.map((sort) => (
                  <button
                    key={sort.value}
                    type="button"
                    aria-pressed={state.sort === sort.value}
                    onClick={() => update({ sort: sort.value as Sort })}
                    className={cn(
                      "h-9 cursor-pointer px-3.5 text-[13px] whitespace-nowrap transition-colors",
                      state.sort === sort.value ? "bg-primary text-primary-foreground" : "text-soft hover:text-foreground",
                    )}
                  >
                    {sort.label}
                  </button>
                ))}
              </span>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.remove}
                  aria-label={`${t.catalog.reset}: ${chip.label}`}
                  className="inline-flex h-8 cursor-pointer items-center gap-2 border border-dashed border-primary/60 bg-primary/8 pr-2.5 pl-3 text-[13px] transition-colors hover:bg-primary/16"
                >
                  {chip.label}
                  <span aria-hidden="true" className="text-primary">
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}

          {found.length > 0 ? (
            <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-[18px]">
              <AnimatePresence mode="popLayout">
                {found.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <ProductCard
                      product={product}
                      number={products.indexOf(product) + 1}
                      thumbnail={thumbnails[`${product.slug}:${cardColor(product, filters, state.colorId).hex}`]}
                      color={cardColor(product, filters, state.colorId)}
                      wished={wished.includes(product.id)}
                      onWish={() => toggleWish(product)}
                      adding={addingId === product.id}
                      onAddToCart={() => addToCart(product, cardColor(product, filters, state.colorId).id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="bp-frame relative flex flex-col items-center gap-4 border border-dashed border-blueprint/35 px-6 py-16 text-center">
              <p className="font-heading text-[22px]">{t.catalog.emptyTitle}</p>
              <p className="max-w-[420px] text-[15px] leading-[1.6] text-muted-foreground">{t.catalog.emptyText}</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={resetAll}
                  className="lx-gold h-12 cursor-pointer bg-primary px-[26px] text-xs font-semibold text-primary-foreground"
                >
                  {t.catalog.reset}
                </button>
                <Link
                  href="/constructor"
                  className="inline-flex h-12 items-center border border-blueprint/30 px-[22px] text-xs font-semibold text-soft transition-colors hover:border-primary hover:text-primary"
                >
                  {t.catalog.toConstructor}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
