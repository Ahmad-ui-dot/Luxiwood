"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { OrdersTab } from "./orders-tab";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";
import { useT } from "@/lib/i18n";

const TABS = ["orders", "profile"] as const;
type Tab = (typeof TABS)[number];

export function AccountView() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, ready, signOut } = useAuth();

  const param = searchParams.get("tab");
  const tab: Tab = TABS.find((item) => item === param) ?? "orders";

  if (!ready) {
    return (
      <div className="flex justify-center py-40">
        <LoaderCircle className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-[max(20px,4vw)] pt-8 pb-[110px]">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-[30px]">
        <nav aria-label={t.common.breadcrumbs} className="flex gap-2.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            {t.account.crumb}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{t.account.title}</span>
        </nav>

        {!user ? (
          <section className="flex max-w-[640px] flex-col items-start gap-[18px] rounded-xl border border-primary/35 bg-[#fffaf3] p-8 sm:p-12">
            <h1 className="font-heading text-[38px] leading-[1.12] font-normal tracking-[-0.02em]">{t.account.title}</h1>
            <p className="text-[17px] font-light text-soft">{t.account.needLogin}</p>
            <Link
              href="/login"
              className="lx-gold inline-flex h-14 items-center bg-primary px-[30px] text-[13px] font-bold text-primary-foreground"
            >
              {t.nav.login}
            </Link>
          </section>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="flex items-center gap-[22px]">
                <span
                  aria-hidden="true"
                  className="flex size-[84px] shrink-0 items-center justify-center rounded-xl border border-primary bg-[#f7efe3] font-heading text-[34px] text-primary"
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-primary">{t.account.title}</p>
                  <h1 className="font-heading text-[clamp(25px,2.73vw,40px)] leading-[1.12] font-normal tracking-[-0.02em]">
                    {t.auth.hello}
                    {user.name}
                  </h1>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="h-[46px] cursor-pointer rounded-xl border border-[rgb(90_62_40/0.25)] px-[22px] text-[13px] font-semibold text-soft transition-colors hover:border-primary hover:text-primary"
              >
                {t.account.logout}
              </button>
            </div>

            <div role="tablist" aria-label={t.account.title} className="flex flex-wrap gap-2.5">
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => router.replace(`/account?tab=${item}`, { scroll: false })}
                  className={cn(
                    "h-12 cursor-pointer rounded-xl border px-[22px] text-sm font-semibold transition-colors",
                    tab === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-[rgb(90_62_40/0.18)] text-soft hover:border-primary hover:text-primary",
                  )}
                >
                  {t.account.tabs[item]}
                </button>
              ))}
            </div>

            <section role="tabpanel" aria-label={t.account.tabs[tab]}>
              {tab === "orders" && <OrdersTab />}
              {tab === "profile" && (
                <div className="grid items-start gap-[18px] lg:grid-cols-2">
                  <ProfileForm />
                  <PasswordForm />
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
