"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

// Пустой список заказов или избранного — пунктирная рамка, как на холсте
export function EmptyTab({ title, text }: { title: string; text: string }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[rgb(90_62_40/0.18)] px-5 py-[60px] text-center">
      <p className="font-heading text-[26px] tracking-[-0.02em]">{title}</p>
      <p className="max-w-[460px] text-[15px] font-light text-soft">{text}</p>
      <Link
        href="/catalog"
        className="lx-gold mt-1.5 inline-flex h-[52px] items-center bg-primary px-7 text-[13px] font-bold text-primary-foreground"
      >
        {t.account.toCatalog}
      </Link>
    </div>
  );
}
