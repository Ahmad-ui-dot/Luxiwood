import type { Metadata } from "next";
import { AdminsPage } from "@/features/admin/components/admins-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.admins };
}

export default function Page() {
  return <AdminsPage />;
}
