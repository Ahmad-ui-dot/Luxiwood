import type { Metadata } from "next";
import { ProductsPage } from "@/features/admin/components/products-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.products };
}

export default function Page() {
  return <ProductsPage />;
}
