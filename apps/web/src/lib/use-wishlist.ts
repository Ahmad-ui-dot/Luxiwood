"use client";

import type { ProductListItem } from "@luxiwood/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

// Сердечки на карточках: какие товары в избранном и переключение. Без входа — подсказка войти
export function useWishlist() {
  const t = useT();
  const router = useRouter();
  const { user, token } = useAuth();
  const [wished, setWished] = useState<number[]>([]);

  useEffect(() => {
    if (!token) {
      setWished([]);
      return;
    }
    api<{ product: ProductListItem }[]>("/me/wishlist", { token })
      .then((items) => setWished(items.map((item) => item.product.id)))
      .catch(() => {});
  }, [token]);

  async function toggleWish(product: ProductListItem) {
    if (!user || !token) {
      toast(t.home.needLoginWish, { action: { label: t.nav.login, onClick: () => router.push("/login") } });
      return;
    }
    const isWished = wished.includes(product.id);
    try {
      await api(`/me/wishlist/${product.id}`, { method: isWished ? "DELETE" : "POST", token });
      setWished(isWished ? wished.filter((id) => id !== product.id) : [...wished, product.id]);
      toast.success(isWished ? t.home.wishRemoved : t.home.wishAdded);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  return { wished, toggleWish };
}
