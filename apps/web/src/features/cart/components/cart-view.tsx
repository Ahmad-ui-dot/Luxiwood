"use client";

import type { OrderCreated } from "@luxiwood/shared";
import { LoaderCircle, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useThumbnails } from "@/features/viewer3d/use-thumbnails";
import { useCart } from "@/lib/cart";
import { furnitureTitle } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { CheckoutForm } from "./checkout-form";

export const goldLink =
  "lx-gold inline-flex h-14 items-center bg-primary px-7 text-[13px] font-bold text-primary-foreground";
export const ghostLink =
  "inline-flex h-14 items-center rounded-xl border border-[rgb(90_62_40/0.3)] px-[26px] text-[13px] font-semibold transition-colors hover:border-primary hover:text-primary";

export function CartView() {
  const t = useT();
  const router = useRouter();
  const { items, count, ready, setQuantity, remove } = useCart();

  // После оформления — отдельная страница «Заказ принят». Корзина его не запоминает:
  // Next сохраняет состояние страниц между переходами, и старый заказ показывался бы при следующей покупке
  function showPlaced(order: OrderCreated) {
    router.push(`/cart/done?number=${encodeURIComponent(order.number)}&total=${order.total}`);
  }

  const thumbnails = useThumbnails(useMemo(() => items.map((item) => ({ key: item.key, type: item.model3dKey, colors: item.preview })), [items]));

  return (
    <div className="px-[max(20px,4vw)] pt-8 pb-[110px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-[30px]">
        <nav aria-label={t.common.breadcrumbs} className="flex gap-2.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            {t.nav.home}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{t.cart.title}</span>
        </nav>

        <div className="flex flex-wrap items-baseline gap-[18px]">
          <h1 className="font-heading text-[clamp(32px,3.6vw,52px)] leading-[1.05] font-normal tracking-[-0.03em]">{t.cart.title}</h1>
          {count > 0 && <span className="text-base text-muted-foreground">{t.cart.countWord(count)}</span>}
        </div>

        {!ready ? (
          <LoaderCircle className="mx-auto my-24 size-7 animate-spin text-primary" />
        ) : items.length === 0 ? (
          <section className="flex flex-col items-center gap-4 border border-dashed border-[rgb(90_62_40/0.18)] px-5 py-20 text-center">
            <ShoppingCart className="size-12 text-blueprint/60" strokeWidth={1.2} />
            <p className="font-heading text-[27px] tracking-[-0.02em]">{t.cart.emptyTitle}</p>
            <p className="text-base font-light text-soft">{t.cart.emptyText}</p>
            <Link href="/catalog" className={goldLink}>
              {t.cart.goCatalog}
            </Link>
          </section>
        ) : (
          <div className="flex flex-wrap items-start gap-9">
            <section aria-label={t.cart.title} className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5">
              {items.map((item) => (
                <article
                  key={item.key}
                  className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-[rgb(90_62_40/0.1)] bg-[#f1e9dd] p-4 sm:pr-6"
                >
                  <Link
                    href={"slug" in item ? `/product/${item.slug}` : `/constructor?type=${item.type}`}
                    className="relative size-[120px] shrink-0 overflow-hidden rounded-xl bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,#f7efe3_0%,#fffaf3_70%)]"
                  >
                    {thumbnails[item.key] && <img src={thumbnails[item.key]} alt="" className="absolute inset-0 size-full object-contain" />}
                  </Link>
                  <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-2">
                    <Link href={"slug" in item ? `/product/${item.slug}` : `/constructor?type=${item.type}`} className="font-heading text-[22px] leading-[1.12] tracking-[-0.02em] transition-colors hover:text-primary">
                      {furnitureTitle(item.title)}
                    </Link>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span aria-hidden="true" className="size-3.5 rounded-xl shadow-[0_0_0_1px_rgb(90_62_40/0.3)]" style={{ background: item.colorHex }} />
                      {[item.colorName, item.sizeLabel].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t.price(item.unitPrice)} {t.cart.each}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-[18px]">
                    <div role="group" aria-label={t.cart.quantity} className="flex items-center gap-1 rounded-xl border border-[rgb(90_62_40/0.18)] p-1">
                      <button
                        type="button"
                        aria-label="−1"
                        disabled={item.quantity <= 1}
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-xl transition-colors hover:bg-primary/12 disabled:cursor-default disabled:opacity-40"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-7 text-center text-base font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="+1"
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-xl transition-colors hover:bg-primary/12"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    <span className="min-w-[120px] text-right text-lg font-bold tabular-nums">{t.price(item.unitPrice * item.quantity)}</span>
                    <button
                      type="button"
                      aria-label={`${t.cart.remove}: ${furnitureTitle(item.title)}`}
                      onClick={() => remove(item.key)}
                      className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-[rgb(181_83_42/0.1)] hover:text-[#b5532a]"
                    >
                      <Trash2 className="size-[18px]" />
                    </button>
                  </div>
                </article>
              ))}
              <p className="text-xs text-dim">{t.cart.pricesNote}</p>
            </section>

            <CheckoutForm onPlaced={showPlaced} />
          </div>
        )}
      </div>
    </div>
  );
}
