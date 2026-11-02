"use client";

import { type ProductListItem } from "@luxiwood/shared";
import { LoaderCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PREVIEW_COLORS } from "@/features/viewer3d/models";
import { useThumbnails } from "@/features/viewer3d/use-thumbnails";
import { api, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { furnitureTitle } from "@/lib/format";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { EmptyTab } from "./empty-tab";
import { useT } from "@/lib/i18n";

export function WishlistTab() {
  const t = useT();
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductListItem[] | null>(null);
  const { addToCart, addingId } = useAddToCart();

  useEffect(() => {
    api<{ product: ProductListItem }[]>("/me/wishlist", { token })
      .then((items) => setProducts(items.map((item) => item.product)))
      .catch((error) => {
        toast.error(toApiError(error).message);
        setProducts([]);
      });
  }, [token]);

  const thumbnails = useThumbnails(
    useMemo(
      () => (products ?? []).map((product) => ({ key: product.slug, type: product.model3dKey, colors: PREVIEW_COLORS[product.model3dKey] })),
      [products],
    ),
  );

  async function remove(product: ProductListItem) {
    try {
      await api(`/me/wishlist/${product.id}`, { method: "DELETE", token });
      setProducts((list) => list?.filter((item) => item.id !== product.id) ?? null);
      toast.success(t.account.wishRemoved);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  if (!products) {
    return <LoaderCircle className="mx-auto my-16 size-6 animate-spin text-primary" />;
  }
  if (products.length === 0) {
    return <EmptyTab title={t.account.noWish} text={t.account.noWishSub} />;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px]">
      {products.map((product) => (
        <article
          key={product.id}
          className="group relative flex flex-col overflow-hidden rounded-xl border border-[rgb(90_62_40/0.1)] bg-[radial-gradient(ellipse_80%_60%_at_50%_42%,#f7efe3_0%,#fffaf3_70%)] transition-colors hover:border-primary/55"
        >
          <Link href={`/product/${product.slug}`} className="flex flex-col text-foreground">
            <div className="relative aspect-square">
              {thumbnails[product.slug] && (
                <img src={thumbnails[product.slug]} alt={`${t.labels.model[product.model3dKey]} — 3D`} className="absolute inset-0 size-full object-contain" />
              )}
            </div>
            <div className="flex flex-col gap-2 px-5 pt-1 pb-5">
              <span className="text-[13px] font-semibold text-muted-foreground">{t.labels.room[product.room]}</span>
              <span className="font-heading text-[19px] leading-[1.12] tracking-[-0.02em]">{furnitureTitle(product.name)}</span>
              {/* Справа место под кнопку «В корзину» — она лежит поверх, вне ссылки */}
              <span className="mt-1.5 flex min-h-[42px] items-center pr-[130px] text-[17px] font-bold">
                {t.home.from} {t.price(product.basePrice)}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={addingId === product.id}
            className="lx-gold absolute right-5 bottom-5 flex h-[42px] cursor-pointer items-center gap-1.5 bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-70"
          >
            {addingId === product.id ? <LoaderCircle className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
            {t.cart.toCart}
          </button>
          <button
            type="button"
            aria-label={`${t.account.wishRemove}: ${t.labels.model[product.model3dKey]}`}
            onClick={() => remove(product)}
            className="absolute top-3.5 right-3.5 flex size-11 cursor-pointer items-center justify-center rounded-xl border border-[rgb(90_62_40/0.2)] bg-[rgb(255_250_243/0.55)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"
                fill="#c0612f"
                stroke="#c0612f"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </article>
      ))}
    </div>
  );
}
