"use client";

import type { Material, ProductDetails, ProductListItem, Quote } from "@luxiwood/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api";
import { MAX_CART_ITEMS, type ProductCartItem, useCart } from "@/lib/cart";
import { furnitureTitle } from "@/lib/format";
import { useT } from "@/lib/i18n";

export type Selection = { mainMaterialId: number; colorMaterialId?: number; woodMaterialId?: number; sizeId?: number };

function findMaterial(list: Material[], id?: number) {
  return id ? list.find((material) => material.id === id) : undefined;
}

// Позиция корзины из товара и выбранных вариантов. unitPrice — цена, посчитанная API
export function buildCartItem(details: ProductDetails, selection: Selection, unitPrice: number, quantity = 1): ProductCartItem {
  const main = findMaterial(details.mainMaterials, selection.mainMaterialId);
  const color = findMaterial(details.colorMaterials, selection.colorMaterialId) ?? main;
  const wood = findMaterial(details.woodMaterials, selection.woodMaterialId);
  const { mainMaterialId, colorMaterialId, woodMaterialId, sizeId } = selection;
  return {
    key: [details.id, mainMaterialId, colorMaterialId, woodMaterialId, sizeId].join("-"),
    productId: details.id,
    mainMaterialId,
    colorMaterialId,
    woodMaterialId,
    sizeId,
    quantity,
    slug: details.slug,
    title: details.name,
    model3dKey: details.model3dKey,
    colorName: color?.name ?? "",
    colorHex: color?.hex ?? "#8E7F72",
    sizeLabel: details.sizes.find((size) => size.id === sizeId)?.label ?? "",
    preview: { main: color?.hex ?? "#8E7F72", wood: wood?.hex },
    unitPrice,
  };
}

// «В корзину» с карточки: берём варианты товара по умолчанию, а цвет — как на карточке, если он доступен.
// Цену уточняем у API, чтобы в корзине была та же сумма, что посчитает сервер
export function useAddToCart() {
  const t = useT();
  const router = useRouter();
  const { items, add } = useCart();
  const [addingId, setAddingId] = useState<number | null>(null);

  async function addToCart(product: ProductListItem, preferredColorId?: number) {
    if (items.length >= MAX_CART_ITEMS) {
      toast.error(t.cart.full);
      return;
    }
    setAddingId(product.id);
    try {
      const details = await api<ProductDetails>(`/products/${product.slug}`);
      const selection: Selection = {
        mainMaterialId: (details.defaults.mainMaterialId ?? details.mainMaterials[0]?.id)!,
        colorMaterialId: details.defaults.colorMaterialId ?? undefined,
        woodMaterialId: details.defaults.woodMaterialId ?? undefined,
        sizeId: details.defaults.sizeId ?? undefined,
      };
      if (preferredColorId) {
        if (findMaterial(details.colorMaterials, preferredColorId)) selection.colorMaterialId = preferredColorId;
        else if (findMaterial(details.mainMaterials, preferredColorId)) selection.mainMaterialId = preferredColorId;
        else if (findMaterial(details.woodMaterials, preferredColorId)) selection.woodMaterialId = preferredColorId;
      }

      const quote = await api<Quote>("/pricing/quote", { method: "POST", body: { productId: product.id, ...selection, quantity: 1 } });
      add(buildCartItem(details, selection, quote.unitPrice));
      toast.success(t.cart.added, { description: furnitureTitle(product.name), action: { label: t.cart.open, onClick: () => router.push("/cart") } });
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setAddingId(null);
    }
  }

  return { addToCart, addingId };
}
