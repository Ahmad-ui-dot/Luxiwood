"use client";

import { Heart, House, LayoutGrid, PencilRuler, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Нижняя панель вкладок на телефоне — как в приложении: до всех разделов достаёт большой палец
export function MobileTabBar() {
  const t = useT();
  const pathname = usePathname();
  const cart = useCart();
  const tabs = [
    { href: "/", label: t.nav.home, icon: House, active: pathname === "/" },
    { href: "/catalog", label: t.nav.catalog, icon: LayoutGrid, active: pathname === "/catalog" || pathname.startsWith("/product/") },
    { href: "/constructor", label: t.nav.constructor, icon: PencilRuler, active: pathname === "/constructor" },
    { href: "/wishlist", label: t.nav.wishlist, icon: Heart, active: pathname === "/wishlist" },
    { href: "/cart", label: t.nav.cart, icon: ShoppingBag, active: pathname.startsWith("/cart") },
  ];

  return (
    <nav
      aria-label={t.nav.menu}
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)] md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch rounded-2xl border border-border bg-[rgb(255_250_243/0.88)] px-1 shadow-[0_-6px_30px_-14px_rgb(90_60_30/0.35)] backdrop-blur-[14px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] tracking-tight transition-colors",
                tab.active ? "font-semibold text-primary" : "text-soft active:text-foreground",
              )}
            >
              {/* Подсветка текущей вкладки плавно переезжает между иконками */}
              {tab.active && (
                <motion.span
                  layoutId="tab-bar-active"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  className="absolute top-2 h-8 w-14 rounded-full bg-primary/12"
                />
              )}
              <span className="relative flex h-8 items-center">
                <Icon className="size-5" strokeWidth={tab.active ? 2 : 1.6} />
                {tab.href === "/cart" && cart.ready && cart.count > 0 && (
                  <span className="absolute -top-0.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                    {cart.count}
                  </span>
                )}
              </span>
              <span className="relative max-w-full truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
