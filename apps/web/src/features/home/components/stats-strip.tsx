import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n-server";

export async function StatsStrip() {
  const t = await getT();
  return (
    <section aria-label={t.brand} className="border-y border-[rgb(90_62_40/0.1)] px-[max(20px,4vw)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {t.home.stats.map((stat, index) => (
          <div key={stat.v} className={cn("flex flex-col gap-2 px-7 py-10", index > 0 && "border-l border-[rgb(90_62_40/0.1)]")}>
            <span className="font-heading text-[38px] leading-[1.12] tracking-[-0.02em] text-primary">{stat.v}</span>
            <span className="text-[15px] text-soft">{stat.t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
