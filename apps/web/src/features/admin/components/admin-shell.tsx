"use client";

import { ArrowLeft, FolderTree, LayoutDashboard, LoaderCircle, LogOut, MessageSquare, Package, Palette, Settings, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LanguageSwitch } from "@/components/layout/language-switch";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// Каркас админки: меню слева (на телефоне — полоса сверху), справа страница. Пускаем только ADMIN
export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const links = [
    { href: "/admin", label: t.admin.nav.overview, icon: LayoutDashboard },
    { href: "/admin/orders", label: t.admin.nav.orders, icon: ShoppingBag },
    { href: "/admin/products", label: t.admin.nav.products, icon: Package },
    { href: "/admin/materials", label: t.admin.nav.materials, icon: Palette },
    { href: "/admin/categories", label: t.admin.nav.categories, icon: FolderTree },
    { href: "/admin/clients", label: t.admin.nav.clients, icon: Users },
    { href: "/admin/reviews", label: t.admin.nav.reviews, icon: MessageSquare },
    { href: "/admin/settings", label: t.admin.nav.settings, icon: Settings },
    { href: "/admin/admins", label: t.admin.nav.admins, icon: ShieldCheck },
  ];
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready, signOut } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (ready && !isAdmin) router.replace("/login");
  }, [ready, isAdmin, router]);

  if (!ready || !isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center py-40">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="flex min-h-full flex-1 flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-border bg-card px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-r lg:border-b-0 lg:py-6">
        <div className="flex items-center justify-between gap-3 px-2">
          <Link href="/admin" aria-label={t.admin.title}>
            <Logo size={28} />
          </Link>
          <LanguageSwitch className="lg:hidden" />
        </div>

        <nav aria-label={t.admin.title} className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(link.href) ? "bg-primary/12 font-medium text-primary" : "text-soft hover:bg-muted hover:text-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto hidden flex-col gap-1 border-t border-border pt-4 lg:flex">
          <div className="flex items-center justify-between gap-3 px-3 pb-3">
            <span className="text-xs text-muted-foreground">{t.language.label}</span>
            <LanguageSwitch />
          </div>
          <div className="flex items-center gap-2.5 px-3 pb-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary uppercase">{user.name[0]}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{t.admin.title}</span>
            </span>
          </div>
          <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-soft transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" />
            {t.admin.toSite}
          </Link>
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-soft transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            {t.admin.logout}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
