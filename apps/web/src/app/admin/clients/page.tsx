import type { Metadata } from "next";
import { ClientsPage } from "@/features/admin/components/clients-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.clients };
}

export default function Page() {
  return <ClientsPage />;
}
