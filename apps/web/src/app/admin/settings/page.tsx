import type { Metadata } from "next";
import { SettingsPage } from "@/features/admin/components/settings-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.settings };
}

export default function Page() {
  return <SettingsPage />;
}
