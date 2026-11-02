import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n-server";

export async function StatsStrip() {
  const t = await getT();
  return (
    <section aria-label={t.brand} className="border-y border-[rgb(90_62_40/0.1)] px-[max(20px,4vw)]">
      {/* На телефоне — сетка 2×2, на компьютере — в один ряд */}
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {t.home.stats.map((stat, index) => (
          <div
            key={stat.v}
            className={cn(
              "flex flex-col gap-2 border-[rgb(90_62_40/0.1)] px-4 py-7 md:px-7 md:py-10",
              index % 2 === 1 && "border-l",
              index >= 2 && "max-md:border-t",
              index === 2 && "md:border-l",
            )}
          >
            <span className="font-heading text-[30px] leading-[1.12] tracking-[-0.02em] text-primary md:text-[38px]">{stat.v}</span>
            <span className="text-sm text-soft md:text-[15px]">{stat.t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
