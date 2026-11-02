import type { Metadata } from "next";
import { MaterialsPage } from "@/features/admin/components/materials-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.materials };
}

export default function Page() {
  return <MaterialsPage />;
}
