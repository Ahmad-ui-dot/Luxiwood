"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { WishlistTab } from "./wishlist-tab";
import { useT } from "@/lib/i18n";

// Отдельная страница избранного (/wishlist) — сердечко в шапке ведёт сюда
export function WishlistView() {
  const t = useT();
  const { user, ready } = useAuth();

  return (
    <div className="px-[max(20px,4vw)] pt-8 pb-[110px]">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-[30px]">
        <nav aria-label={t.common.breadcrumbs} className="flex gap-2.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            {t.nav.home}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{t.wishlist.title}</span>
        </nav>
        <h1 className="font-heading text-[clamp(32px,3.6vw,52px)] leading-[1.05] font-normal tracking-[-0.03em]">{t.wishlist.title}</h1>

        {!ready ? (
          <LoaderCircle className="mx-auto my-24 size-7 animate-spin text-primary" />
        ) : !user ? (
          <section className="flex max-w-[640px] flex-col items-start gap-[18px] rounded-xl border border-primary/35 bg-[#fffaf3] p-8 sm:p-12">
            <p className="text-[17px] font-light text-soft">{t.wishlist.needLogin}</p>
            <Link
              href="/login"
              className="lx-gold inline-flex h-14 items-center bg-primary px-[30px] text-[13px] font-bold text-primary-foreground"
            >
              {t.nav.login}
            </Link>
          </section>
        ) : (
          <WishlistTab />
        )}
      </div>
    </div>
  );
}
