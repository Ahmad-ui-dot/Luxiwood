"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// 3D работает только в браузере
const HeroSofaScene = dynamic(() => import("@/features/viewer3d/hero-sofa-scene"), { ssr: false });

// Линии выносок к подписям: каркас (слева), обивка (сверху справа), опоры (снизу справа). dot — точка на детали
const LEADERS = [
  { d: "M32 58 L18 70 L4 70", dot: [32, 58] },
  { d: "M58 46 L66 30 L86 30", dot: [58, 46] },
  { d: "M71 53 L82 72 L95 72", dot: [71, 53] },
];

export function Hero() {
  const t = useT();
  const [fabric, setFabric] = useState(t.home.fabrics[0]);

  return (
    <section aria-label={t.brand} className="bp-paper relative overflow-hidden">
      <div className="relative mx-auto flex max-w-[1360px] flex-wrap items-center gap-10 px-[max(20px,4vw)] pt-10 pb-12 sm:gap-12 sm:pt-[72px] sm:pb-16">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[26px]">
          <p className="flex items-center gap-3 text-sm font-medium text-blueprint">
            <span className="h-px w-10 bg-primary" />
            {t.home.eyebrow}
          </p>

          <h1 className="font-heading text-[clamp(34px,3.8vw,60px)] leading-[1.08] font-normal tracking-[-0.02em] text-balance">
            {t.home.h1a}
            <span className="text-primary italic">{t.home.h1i}</span>
            {t.home.h1b}
          </h1>

          <p className="max-w-[520px] text-lg leading-[1.6] font-light text-soft">{t.home.heroSub}</p>

          <div className="flex flex-wrap gap-3.5">
            <Link href="/catalog" className="lx-gold inline-flex h-[58px] items-center gap-3 bg-primary px-[34px] text-base font-semibold text-primary-foreground">
              {t.home.ctaCatalog}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/constructor"
              className="inline-flex h-[58px] items-center rounded-xl border border-blueprint/40 px-[30px] text-base font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/8 hover:text-primary"
            >
              {t.home.ctaBuild}
            </Link>
          </div>

          <dl className="mt-2.5 flex max-w-[520px] flex-wrap gap-3">
            {t.home.specs.map((spec) => (
              <div key={spec.n} className="flex flex-col gap-0.5 rounded-xl border border-blueprint/20 bg-[rgb(255_250_243/0.6)] px-4 py-3">
                <dt className="text-xs text-muted-foreground">{spec.k}</dt>
                <dd className="text-[15px] font-medium text-foreground">{spec.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-w-0 flex-[1.25_1_560px]">
          <div className="bp-frame relative h-[clamp(380px,46vw,600px)] overflow-hidden border border-blueprint/20 bg-[radial-gradient(ellipse_60%_55%_at_50%_58%,rgb(192_97_47/0.18),transparent_70%),rgb(255_250_243/0.65)]">
            <span className="absolute top-4 left-4 z-[3] flex items-center gap-2 rounded-full bg-[rgb(255_250_243/0.9)] px-3.5 py-1.5 text-[13px] text-soft">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              {t.home.hLive}
            </span>

            <div role="img" aria-label={`${t.common.sofa3d}. ${t.home.hDrag}`} className="absolute inset-x-[6%] top-[15%] bottom-[20%] z-[1]">
              <HeroSofaScene fabricHex={fabric.hex} />
            </div>

            {/* Выноски: точка на детали дивана, линия «рисуется» к подписи. Координаты — в процентах блока */}
            <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[2] hidden size-full sm:block">
              {LEADERS.map((leader) => (
                <path
                  key={leader.d}
                  className="bp-draw"
                  style={{ "--len": 600 } as React.CSSProperties}
                  d={leader.d}
                  fill="none"
                  stroke="#a07a52"
                  strokeWidth="1.25"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            {LEADERS.map((leader) => (
              <span
                key={leader.d}
                aria-hidden="true"
                className="absolute z-[2] hidden size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-4 ring-primary/20 sm:block"
                style={{ left: `${leader.dot[0]}%`, top: `${leader.dot[1]}%` }}
              />
            ))}
            <Callout className="top-[calc(70%-32px)] left-[4%]" text={t.home.c1} />
            <Callout className="top-[calc(30%-32px)] left-[66%]" text={`${t.home.c2} · ${fabric.name}`} />
            <Callout className="top-[calc(72%-32px)] right-[5%]" text={t.home.c3} />

            <div className="absolute inset-x-4 bottom-4 z-[3] flex items-center gap-3 rounded-xl bg-[rgb(255_250_243/0.9)] px-4 py-3">
              <span className="text-[13px] text-soft">{t.home.hFabric}</span>
              <span role="group" aria-label={t.home.hFabric} className="flex gap-2">
                {t.home.fabrics.map((option) => (
                  <button
                    key={option.hex}
                    type="button"
                    aria-label={option.name}
                    title={option.name}
                    aria-pressed={option.hex === fabric.hex}
                    onClick={() => setFabric(option)}
                    className={cn(
                      "size-8 cursor-pointer rounded-full border-2 p-[3px] transition-colors",
                      option.hex === fabric.hex ? "border-primary" : "border-transparent hover:border-blueprint/50",
                    )}
                  >
                    <span className="block size-full rounded-full" style={{ backgroundColor: option.hex }} />
                  </button>
                ))}
              </span>
              <span className="ml-auto hidden text-[13px] text-foreground sm:inline">{fabric.name}</span>
            </div>
          </div>

          <p className="mt-3 flex items-center gap-2.5 text-[13px] text-dim">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
            </svg>
            {t.home.hDrag}
          </p>
        </div>
      </div>
    </section>
  );
}

function Callout({ className, text }: { className: string; text: string }) {
  return (
    <span className={`absolute z-[2] hidden rounded-full border border-blueprint/20 bg-[rgb(255_250_243/0.9)] px-3 py-1 text-xs text-soft sm:inline ${className}`}>
      {text}
    </span>
  );
}
