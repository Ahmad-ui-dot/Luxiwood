"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const AssemblyScene = dynamic(() => import("@/features/viewer3d/assembly-scene"), { ssr: false });

// Высокая секция (560vh): пока её листаешь, экран стоит на месте, а диван собирается по шагам
export function AssemblySection() {
  const t = useT();
  const track = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [step, setStep] = useState(0);
  const [bar, setBar] = useState(0);

  useEffect(() => {
    function update() {
      const element = track.current;
      if (!element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - window.innerHeight)));
      progress.current = p;
      setStep(Math.min(5, Math.floor(p * 6 + 0.15)));
      setBar(Math.round(p * 100));
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section ref={track} aria-label={t.home.asEyebrow} className="relative h-[560vh]">
      {/* На телефоне и планшете — столбиком: 3D-диван сверху под шапкой, под ним только текущий шаг */}
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden bg-[radial-gradient(ellipse_50%_55%_at_64%_55%,rgb(192_97_47/0.12)_0%,transparent_70%)] pt-20 lg:h-screen lg:flex-row lg:flex-wrap lg:items-center lg:pt-0">
        <div className="relative z-[2] box-border flex max-w-[540px] min-w-0 flex-col gap-2 px-[max(20px,4vw)] pb-[calc(96px+env(safe-area-inset-bottom))] lg:flex-[1_1_380px] lg:gap-3 lg:pb-0">
          <p className="text-xs font-semibold text-primary">{t.home.asEyebrow}</p>
          <h2 className="mb-1.5 font-heading text-[clamp(24px,2.45vw,38px)] leading-[1.12] font-normal tracking-[-0.02em]">
            {t.home.asA}
            <span className="font-light text-primary">{t.home.asI}</span>
          </h2>
          <p className="mb-1 font-heading text-lg tracking-[-0.02em] text-muted-foreground tabular-nums">
            <span className="text-[40px] leading-none text-foreground lg:text-[56px]">0{step + 1}</span> / 06
          </p>

          {t.home.asSteps.map((item, index) => {
            const done = index < step;
            const active = index === step;
            return (
              <div
                key={item.title}
                className={cn("flex gap-4 border-l-2 py-2.5 pl-[18px] transition-all duration-[450ms]", !active && "max-lg:hidden")}
                style={{
                  borderColor: active ? "#c0612f" : done ? "rgb(192 97 47 / 0.4)" : "rgb(120 88 60 / 0.14)",
                  opacity: active ? 1 : done ? 0.55 : 0.28,
                  transform: `translateX(${active ? 6 : 0}px)`,
                }}
              >
                <div className="flex flex-col gap-1">
                  <p className={`text-[17px] font-semibold ${active ? "text-foreground" : "text-soft"}`}>{item.title}</p>
                  {active && <p className="text-[15px] leading-[1.55] font-light text-soft">{item.text}</p>}
                </div>
              </div>
            );
          })}

          <div className="mt-3.5 h-[3px] overflow-hidden rounded-xl bg-[rgb(90_62_40/0.1)]">
            <div className="h-full rounded-xl bg-primary" style={{ width: `${bar}%` }} />
          </div>
          <p className="mt-1.5 text-[13px] text-dim max-lg:hidden">{t.home.asSub}</p>
        </div>

        <div role="img" aria-label={`${t.home.asEyebrow}: 3D`} className="relative min-h-0 min-w-0 flex-1 max-lg:order-first lg:h-screen lg:flex-[999_1_520px]">
          <AssemblyScene progress={progress} />
        </div>
      </div>
    </section>
  );
}
