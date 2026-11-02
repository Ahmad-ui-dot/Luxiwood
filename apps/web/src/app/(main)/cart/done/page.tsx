import type { Metadata } from "next";
import { OrderDone } from "@/features/cart/components/order-done";
import { getT } from "@/lib/i18n-server";

type Props = { searchParams: Promise<{ number?: string; total?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.cart.okTitle };
}

// Номер и сумма заказа приходят в адресе: /cart/done?number=LX-2026-0005&total=5600
export default async function OrderDonePage({ searchParams }: Props) {
  const { number, total } = await searchParams;
  return <OrderDone number={number ?? ""} total={Number(total) || 0} />;
}
