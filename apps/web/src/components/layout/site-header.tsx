"use client";

import { Heart, LayoutDashboard, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { LanguageSwitch } from "./language-switch";
import { Logo } from "./logo";
import { useT } from "@/lib/i18n";

// Круглая кнопка-иконка справа в шапке
const iconButton = "relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary/10 hover:text-primary";

// Шапка — плавающая скруглённая панель: логотип, меню «таблетками», избранное, корзина, вход
export function SiteHeader() {
  const t = useT();
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const cart = useCart();
  const links = [
    { href: "/", label: t.nav.home },
    { href: "/catalog", label: t.nav.catalog },
    { href: "/constructor", label: t.nav.constructor },
  ];

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border bg-[rgb(255_250_243/0.85)] px-3 py-2 shadow-[0_10px_30px_-14px_rgb(90_60_30/0.3)] backdrop-blur-[14px] sm:px-5">
        <Link href="/" aria-label={`${t.brand} — ${t.nav.home}`} className="flex items-center py-1">
          <Logo size={30} />
        </Link>

        <nav aria-label={t.nav.home} className="order-last flex w-full justify-center gap-1 md:order-none md:w-auto md:flex-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-[15px] whitespace-nowrap transition-colors",
                  active ? "bg-primary/12 font-medium text-primary" : "text-soft hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LanguageSwitch className="mr-1" />
          <Link href="/wishlist" aria-label={t.nav.wishlist} title={t.nav.wishlist} className={iconButton}>
            <Heart className="size-[19px]" strokeWidth={1.6} />
          </Link>
          <Link href="/cart" aria-label={`${t.nav.cart}: ${cart.count}`} title={t.nav.cart} className={iconButton}>
            <ShoppingBag className="size-[19px]" strokeWidth={1.6} />
            {cart.ready && cart.count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-card">
                {cart.count}
              </span>
            )}
          </Link>

          {ready && user?.role === "ADMIN" && (
            <Link href="/admin" aria-label={t.admin.title} title={t.admin.title} className={iconButton}>
              <LayoutDashboard className="size-[19px]" strokeWidth={1.6} />
            </Link>
          )}

          {ready && !user && (
            <Link
              href="/login"
              className="ml-1 flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[#a5521f]"
            >
              {t.nav.login}
            </Link>
          )}

          {ready && user && (
            <Link
              href="/account"
              aria-label={`${t.nav.account}: ${user.name}`}
              className="ml-1 flex h-10 items-center gap-2 rounded-full border border-border bg-card pr-4 pl-1 text-sm transition-colors hover:border-primary/50 hover:text-primary"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{t.nav.account}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
