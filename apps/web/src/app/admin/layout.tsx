import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: { default: t.admin.title, template: `%s · ${t.admin.title}` }, robots: { index: false } };
}

// Админка без шапки и подвала сайта. Suspense нужен: меню читает адрес страницы (usePathname)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
