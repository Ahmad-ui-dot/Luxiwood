import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Шапка читает адрес страницы (usePathname) — без Suspense Next.js ругается */}
      <Suspense fallback={<div className="h-[76px]" />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      {/* Подвал берёт телефон и часы работы из API */}
      <Suspense fallback={null}>
        <SiteFooter />
      </Suspense>
    </>
  );
}
