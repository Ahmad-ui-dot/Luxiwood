import type { Metadata } from "next";
import { ProductForm } from "@/features/admin/components/product-form";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.newProduct };
}

export default function Page() {
  return <ProductForm />;
}
