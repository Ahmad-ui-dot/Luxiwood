"use client";

import { calcProductPrice, CONFIGURATOR_KEYS, type Material, type ProductDetails } from "@luxiwood/shared";
import { Minus, Plus, RotateCcw, RotateCw, Ruler } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { ViewControls } from "@/features/viewer3d/product-scene";
import { MAX_CART_ITEMS, useCart } from "@/lib/cart";
import { furnitureTitle } from "@/lib/format";
import { buildCartItem, type Selection } from "@/lib/use-add-to-cart";
import { useWishlist } from "@/lib/use-wishlist";
import { cn } from "@/lib/utils";
import { OtherModels } from "./other-models";
import { ReviewsSection } from "./reviews-section";
import { useT } from "@/lib/i18n";

const ProductScene = dynamic(() => import("@/features/viewer3d/product-scene"), { ssr: false });

const labelClass = "text-[13px] font-semibold text-muted-foreground";
const toolClass =
  "flex size-11 cursor-pointer items-center justify-center border border-blueprint/30 bg-[rgb(255_250_243/0.9)] text-foreground transition-colors hover:border-primary hover:text-primary";

// placeholder — подпись, когда ничего не выбрано (например, цвет обивки по желанию)
export function Swatches({
  title,
  list,
  value,
  onPick,
  placeholder,
}: {
  title: string;
  list: Material[];
  value?: number;
  onPick: (id: number) => void;
  placeholder?: string;
}) {
  const t = useT();
  if (list.length === 0) return null;
  const selected = list.find((material) => material.id === value);
  return (
    <div className="flex flex-col gap-3.5">
      <p className={labelClass}>
        {title} — <span className="text-foreground">{selected?.name ?? placeholder}</span>
      </p>
      <div role="group" aria-label={title} className="flex flex-wrap gap-2.5">
        {list.map((material) => (
          <button
            key={material.id}
            type="button"
            aria-label={material.name}
            title={material.priceDelta ? `${material.name} · +${t.price(material.priceDelta)}` : material.name}
            aria-pressed={material.id === value}
            onClick={() => onPick(material.id)}
            style={{ background: material.hex }}
            className={cn(
              "size-11 cursor-pointer rounded-xl transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5",
              material.id === value ? "shadow-[0_0_0_2px_#f6f0e6,0_0_0_4px_#c0612f]" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductView({ product }: { product: ProductDetails }) {
  const t = useT();
  const router = useRouter();
  const cart = useCart();
  const { wished, toggleWish } = useWishlist();
  const controls = useRef<ViewControls>({ yaw: -0.65, zoom: 1 });
  const title = furnitureTitle(product.name);
  const isFabric = product.kind === "FABRIC";

  const [selection, setSelection] = useState<Selection>({
    mainMaterialId: (product.defaults.mainMaterialId ?? product.mainMaterials[0]?.id)!,
    colorMaterialId: product.defaults.colorMaterialId ?? undefined,
    woodMaterialId: product.defaults.woodMaterialId ?? undefined,
    sizeId: product.defaults.sizeId ?? product.sizes[0]?.id,
  });
  const pick = (patch: Partial<Selection>) => setSelection((current) => ({ ...current, ...patch }));
  const [niche, setNiche] = useState("");

  const main = product.mainMaterials.find((material) => material.id === selection.mainMaterialId);
  const color = product.colorMaterials.find((material) => material.id === selection.colorMaterialId);
  const wood = product.woodMaterials.find((material) => material.id === selection.woodMaterialId);
  const size = product.sizes.find((item) => item.id === selection.sizeId);
  const defaultSize = product.sizes.find((item) => item.isDefault) ?? product.sizes[0];

  // Та же формула, что на сервере (из shared) — цена меняется сразу при выборе
  const price = main
    ? calcProductPrice({
        basePrice: product.basePrice,
        mainMaterial: main,
        colorMaterial: color,
        woodMaterial: wood,
        size: size && { name: size.label, priceDelta: size.priceDelta },
        quantity: 1,
      }).unitPrice
    : product.basePrice;

  // Цвет модели: у мягкой мебели — цвет обивки (или ткань), у корпусной — дерево
  const colors = useMemo(() => ({ main: (isFabric ? (color ?? main) : main)?.hex ?? "#8E7F72", wood: wood?.hex }), [isFabric, color, main, wood]);
  const scale = useMemo<[number, number, number]>(
    () =>
      size && defaultSize
        ? [size.widthCm / defaultSize.widthCm, size.heightCm / defaultSize.heightCm, size.depthCm / defaultSize.depthCm]
        : [1, 1, 1],
    [size, defaultSize],
  );

  const width = size?.widthCm ?? product.widthCm;
  const nicheCm = Number(niche);
  const fits = nicheCm >= width;
  const fitMax = Math.max(nicheCm, width);

  function addToCart(goToCart: boolean) {
    if (cart.items.length >= MAX_CART_ITEMS) {
      toast.error(t.cart.full);
      return;
    }
    cart.add(buildCartItem(product, selection, price));
    if (goToCart) {
      router.push("/cart");
    } else {
      toast.success(t.cart.added, { description: title, action: { label: t.cart.open, onClick: () => router.push("/cart") } });
    }
  }

  const stars = Math.round(product.ratingAvg);
  const isWished = wished.includes(product.id);
  const canConfigure = (CONFIGURATOR_KEYS as readonly string[]).includes(product.model3dKey);

  // Нижняя панель «В корзину» на телефоне прячется, когда видны основные кнопки
  const buyRef = useRef<HTMLDivElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);
  useEffect(() => {
    if (!buyRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setBuyVisible(entry.isIntersecting));
    observer.observe(buyRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="px-[max(20px,4vw)] pt-7 pb-[110px]">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-[26px]">
        <nav aria-label={t.common.breadcrumbs} className="flex flex-wrap gap-2.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            {t.nav.home}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalog" className="transition-colors hover:text-foreground">
            {t.catalog.title}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/catalog?type=${product.model3dKey}`} className="transition-colors hover:text-foreground">
            {product.category.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        <div className="flex flex-wrap items-start gap-14">
          {/* 3D-просмотр с размерными линиями и панелью управления */}
          <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-4">
            <div className="bp-frame bp-paper relative h-[clamp(380px,60vw,640px)] overflow-hidden rounded-xl border border-blueprint/30 bg-[#f1e9dd]">
              <div className="bp-dim top-[76px] right-[16%] left-[16%] z-[2]">
                <i />
                <span>
                  {width} {t.catalog.cm}
                </span>
                <i />
              </div>
              {size && (
                <div className="bp-vdim top-[24%] right-[26px] bottom-[30%] z-[2]">
                  <i />
                  <span>
                    {size.heightCm} {t.catalog.cm}
                  </span>
                  <i />
                </div>
              )}
              <p className="absolute top-6 left-6 z-[2] text-[13px] text-blueprint">{product.sku}</p>
              <div className="absolute inset-0">
                <ProductScene type={product.model3dKey} colors={colors} scale={scale} controls={controls} />
              </div>
              <p className="pointer-events-none absolute bottom-6 left-6 z-[2] flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <span className="rounded-xl border border-primary/60 px-2.5 py-1 text-[13px] font-bold text-primary">3D</span>
                <span className="hidden sm:inline">{t.product.viewHint}</span>
              </p>
              <div role="toolbar" aria-label={t.product.toolbar} className="absolute right-6 bottom-6 z-[2] flex gap-2">
                <button type="button" aria-label={t.product.turnLeft} onClick={() => (controls.current.yaw += 0.6)} className={toolClass}>
                  <RotateCcw className="size-[18px]" />
                </button>
                <button type="button" aria-label={t.product.turnRight} onClick={() => (controls.current.yaw -= 0.6)} className={toolClass}>
                  <RotateCw className="size-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label={t.product.zoomOut}
                  onClick={() => (controls.current.zoom = Math.min(controls.current.zoom + 0.15, 1.5))}
                  className={toolClass}
                >
                  <Minus className="size-[18px]" />
                </button>
                <button
                  type="button"
                  aria-label={t.product.zoomIn}
                  onClick={() => (controls.current.zoom = Math.max(controls.current.zoom - 0.15, 0.55))}
                  className={toolClass}
                >
                  <Plus className="size-[18px]" />
                </button>
              </div>
            </div>
            <OtherModels product={product} />
          </div>

          {/* Выбор вариантов и покупка */}
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[30px] pt-2">
            <div className="flex flex-col gap-3.5">
              <p className="text-xs font-semibold text-primary">
                {product.category.name} · {product.sku}
              </p>
              <h1 className="font-heading text-[clamp(30px,3vw,44px)] leading-[1.08] font-normal tracking-[-0.02em]">{title}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <a href="#reviews" className="flex items-center gap-2 text-sm text-soft transition-colors hover:text-foreground">
                  <span className="flex gap-0.5" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((index) => (
                      <svg key={index} width="15" height="15" viewBox="0 0 24 24">
                        <path
                          d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.4l6.6-.8z"
                          fill={index <= stars ? "#c0612f" : "rgb(120 88 60 / 0.2)"}
                        />
                      </svg>
                    ))}
                  </span>
                  {product.reviewsCount > 0 && `${product.ratingAvg.toFixed(1)} · `}
                  {t.product.reviewsLink(product.reviewsCount)}
                </a>
                <button
                  type="button"
                  aria-pressed={isWished}
                  onClick={() => toggleWish(product)}
                  className="flex cursor-pointer items-center gap-2 text-sm text-soft transition-colors hover:text-primary"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
                      fill={isWished ? "#c0612f" : "none"}
                      stroke="#c0612f"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isWished ? t.product.inWishlist : t.product.toWishlist}
                </button>
              </div>
              <p className="text-[17px] leading-[1.65] font-light text-soft">{product.description}</p>
              <p className="flex items-baseline gap-3 font-heading text-[34px] tracking-[-0.02em]">
                {t.price(price)}
                {product.oldPrice && <s className="font-sans text-base text-dim">{t.price(product.oldPrice)}</s>}
              </p>
            </div>

            <div className="flex flex-col gap-6 border-t border-[rgb(90_62_40/0.1)] pt-6">
              <Swatches
                title={isFabric ? t.product.fabric : t.product.wood}
                list={product.mainMaterials}
                value={selection.mainMaterialId}
                onPick={(id) => pick({ mainMaterialId: id })}
              />
              <Swatches title={t.product.color} list={product.colorMaterials} value={selection.colorMaterialId} onPick={(id) => pick({ colorMaterialId: id })} />
              <Swatches
                title={isFabric ? t.product.woodLegs : t.product.wood}
                list={product.woodMaterials}
                value={selection.woodMaterialId}
                onPick={(id) => pick({ woodMaterialId: id })}
              />
              {product.sizes.length > 0 && (
                <div className="flex flex-col gap-3.5">
                  <p className={labelClass}>{t.product.size}</p>
                  <div role="group" aria-label={t.product.size} className="flex flex-wrap gap-2.5">
                    {product.sizes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={item.id === selection.sizeId}
                        onClick={() => pick({ sizeId: item.id })}
                        className={cn(
                          "h-12 cursor-pointer rounded-xl border px-[18px] text-[15px] font-semibold transition-colors",
                          item.id === selection.sizeId
                            ? "border-primary bg-primary/12 text-foreground"
                            : "border-[rgb(90_62_40/0.2)] text-soft hover:border-blueprint hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Встанет ли у вас: сравниваем ширину ниши с шириной выбранного размера */}
            <div className="bp-frame relative flex flex-col gap-3 border border-blueprint/28 bg-[rgb(255_250_243/0.7)] p-[18px]">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-[13px] text-blueprint">
                  <b className="font-medium text-primary">◆</b> {t.product.fitTitle}
                </p>
                <span className="text-[13px] text-muted-foreground">
                  {title}: {width} {t.catalog.cm}
                </span>
              </div>
              <p className="text-[13px] leading-normal text-muted-foreground">{t.product.fitSub}</p>
              <label className="flex h-12 items-center gap-3 rounded-xl border border-[rgb(90_62_40/0.18)] bg-[rgb(90_62_40/0.05)] px-4 transition-colors focus-within:border-primary">
                <Ruler className="size-4 text-blueprint" />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                  placeholder={t.product.fitPlaceholder}
                  aria-label={t.product.fitPlaceholder}
                  className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-dim"
                />
                <span className="text-xs text-dim">{t.catalog.cm}</span>
              </label>
              {nicheCm > 0 && (
                <>
                  <div aria-hidden="true" className="relative mt-1 h-[34px]">
                    <div className="absolute top-0 left-0 h-3 border border-t-0 border-blueprint" style={{ width: `${(nicheCm / fitMax) * 100}%` }} />
                    <div className={cn("absolute top-4 left-0 h-4 opacity-85", fits ? "bg-[#3d8b57]" : "bg-[#b5532a]")} style={{ width: `${(width / fitMax) * 100}%` }} />
                  </div>
                  <p role="status" className={cn("flex items-center gap-2.5 text-sm font-medium", fits ? "text-[#3d8b57]" : "text-[#b5532a]")}>
                    <span className="">{fits ? "✓" : "✕"}</span>
                    {fits ? t.product.fitOk : t.product.fitNo}
                    {Math.abs(nicheCm - width)} {t.catalog.cm}
                  </p>
                </>
              )}
            </div>

            <div ref={buyRef} className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => addToCart(false)}
                className="lx-gold flex h-[60px] cursor-pointer items-center justify-center gap-3 bg-primary text-sm font-bold text-primary-foreground"
              >
                {t.product.toCart} · {t.price(price)}
              </button>
              <button
                type="button"
                onClick={() => addToCart(true)}
                className="h-[54px] cursor-pointer rounded-xl border border-primary/60 text-[13px] font-bold text-primary transition-colors hover:bg-primary/8"
              >
                {t.product.oneClick}
              </button>
              {canConfigure && (
                <Link
                  href={`/constructor?type=${product.model3dKey}`}
                  className="flex h-[54px] items-center justify-center gap-2.5 rounded-xl border border-[rgb(90_62_40/0.25)] text-[13px] font-semibold text-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <Ruler className="size-4" />
                  {t.product.constructor}
                </Link>
              )}
            </div>

            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 border-t border-[rgb(90_62_40/0.1)] pt-6 text-[15px]">
              <dt className="text-muted-foreground">{t.product.dims}</dt>
              <dd>{size ? `${size.widthCm} × ${size.depthCm} × ${size.heightCm} ${t.catalog.cm}` : `${product.widthCm} ${t.catalog.cm}`}</dd>
              <dt className="text-muted-foreground">{t.product.materials}</dt>
              <dd>{product.materialsText}</dd>
              <dt className="text-muted-foreground">{t.product.making}</dt>
              <dd>{t.product.makingDays(product.productionDays)}</dd>
              <dt className="text-muted-foreground">{t.product.delivery}</dt>
              <dd>{t.product.deliveryText}</dd>
            </dl>
          </div>
        </div>

        <ReviewsSection productId={product.id} />
      </div>

      {/* Телефон: цена и «В корзину» под рукой, над панелью вкладок */}
      <div
        inert={buyVisible}
        className={cn(
          "fixed inset-x-3 bottom-[calc(max(env(safe-area-inset-bottom),12px)+72px)] z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-[rgb(255_250_243/0.92)] p-2 pl-4 shadow-[0_-6px_30px_-14px_rgb(90_60_30/0.35)] backdrop-blur-[14px] transition-[opacity,translate] duration-200 md:hidden",
          buyVisible && "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <p className="min-w-0 flex-1 truncate font-heading text-xl tracking-[-0.02em]">{t.price(price)}</p>
        <button
          type="button"
          onClick={() => addToCart(false)}
          className="lx-gold h-11 shrink-0 cursor-pointer bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          {t.product.toCart}
        </button>
      </div>
    </div>
  );
}
