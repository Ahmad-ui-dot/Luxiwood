import type { Metadata } from "next";
import { CartView } from "@/features/cart/components/cart-view";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.cart.title };
}

export default function CartPage() {
  return <CartView />;
}
