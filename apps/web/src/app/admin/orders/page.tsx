import type { Metadata } from "next";
import { OrdersPage } from "@/features/admin/components/orders-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.orders };
}

export default function Page() {
  return <OrdersPage />;
}
