import type { Metadata } from "next";
import { CategoriesPage } from "@/features/admin/components/categories-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.categories };
}

export default function Page() {
  return <CategoriesPage />;
}
