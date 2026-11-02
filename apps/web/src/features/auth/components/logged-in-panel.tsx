"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

// Показывается вместо формы, когда пользователь уже вошёл — как на холсте
export function LoggedInPanel() {
  const t = useT();
  const { user, signOut } = useAuth();
  if (!user) {
    return null;
  }

  return (
    <div className="flex w-full max-w-[440px] flex-col items-start gap-5">
      <h2 className="font-heading text-[33px] leading-[1.12] font-normal tracking-[-0.02em]">
        {t.auth.hello}
        {user.name}!
      </h2>
      <p className="text-base leading-[1.6] font-light text-soft">{t.auth.loggedText}</p>
      <div className="flex flex-wrap gap-2.5">
        <Link
          href="/catalog"
          className="lx-gold inline-flex h-14 items-center bg-primary px-7 text-[13px] font-bold text-primary-foreground"
        >
          {t.auth.goCatalog}
        </Link>
        {user.role === "ADMIN" ? (
          <Link
            href="/admin"
            className="inline-flex h-14 items-center rounded-xl border border-dashed border-primary/60 px-[26px] text-[13px] font-bold text-primary transition-colors hover:bg-primary/8"
          >
            {t.auth.admin}
          </Link>
        ) : (
          <Link
            href="/account"
            className="inline-flex h-14 items-center rounded-xl border border-[rgb(90_62_40/0.3)] px-[26px] text-[13px] font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            {t.auth.goAccount}
          </Link>
        )}
      </div>
      <button type="button" onClick={signOut} className="h-11 cursor-pointer text-sm text-muted-foreground underline transition-colors hover:text-foreground">
        {t.nav.logout}
      </button>
    </div>
  );
}
