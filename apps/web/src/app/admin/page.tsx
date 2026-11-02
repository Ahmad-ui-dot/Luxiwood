import type { Metadata } from "next";
import { OverviewPage } from "@/features/admin/components/overview-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.overview };
}

export default function Page() {
  return <OverviewPage />;
}
