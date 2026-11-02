"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { ghostLink, goldLink } from "./cart-view";

// Отдельная страница «Заказ принят» — /cart/done. Корзина сама по себе это состояние не хранит,
// поэтому при следующей покупке в корзине снова видны товары, а не старый заказ
export function OrderDone({ number, total }: { number: string; total: number }) {
  const t = useT();
  const { user } = useAuth();

  return (
    <div className="px-[max(20px,4vw)] pt-8 pb-[110px]">
      <section aria-live="polite" className="bp-frame relative mx-auto flex max-w-[760px] flex-col items-start gap-5 border border-primary/35 bg-[#fffaf3] p-8 sm:p-12">
        <span aria-hidden="true" className="flex size-16 items-center justify-center border border-primary text-primary">
          <Check className="size-8" />
        </span>
        <h1 className="font-heading text-[35px] leading-[1.12] font-normal tracking-[-0.02em]">{t.cart.okTitle}</h1>
        {number && (
          <p className="text-base text-muted-foreground">
            {t.cart.orderNumber}: <b className="text-xl text-foreground">{number}</b>
            {total > 0 && <> · {t.price(total)}</>}
          </p>
        )}
        <p className="max-w-[560px] text-[17px] leading-[1.6] font-light text-soft">{user ? t.cart.okText : t.cart.okGuestText}</p>
        <div className="flex flex-wrap gap-3">
          {user && (
            <Link href="/account?tab=orders" className={goldLink}>
              {t.cart.toAccount}
            </Link>
          )}
          <Link href="/catalog" className={user ? ghostLink : goldLink}>
            {t.cart.continueShopping}
          </Link>
        </div>
      </section>
    </div>
  );
}
