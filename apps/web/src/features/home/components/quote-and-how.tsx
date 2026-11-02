import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n-server";

export async function QuoteSection() {
  const t = await getT();
  return (
    <section className="px-[max(20px,4vw)] py-[100px]">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-7 text-center">
        <p className="font-heading text-[clamp(23px,2.72vw,41px)] leading-[1.15] font-normal tracking-[-0.02em] text-balance">
          {t.home.qA}
          <span className="text-primary">{t.home.qI}</span>
          {t.home.qB}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">{t.home.qSign}</p>
      </div>
    </section>
  );
}

export async function HowSection() {
  const t = await getT();
  return (
    <section id="how" className="px-[max(20px,4vw)] pt-10 pb-[120px]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-12">
        <h2 className="font-heading text-[clamp(25px,2.73vw,42px)] leading-[1.12] font-normal tracking-[-0.02em]">{t.home.howTitle}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] border-t border-[rgb(90_62_40/0.14)]">
          {t.home.how.map((item, index) => (
            <div
              key={item.n}
              className={cn(
                "flex flex-col gap-3.5 pt-9 pb-2",
                index === 0 && "pr-8",
                index === 1 && "border-l border-[rgb(90_62_40/0.14)] px-8",
                index === 2 && "border-l border-[rgb(90_62_40/0.14)] pl-8",
              )}
            >
              <span className="font-heading text-[33px] leading-[1.12] tracking-[-0.02em] text-primary">{item.n}</span>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-base leading-[1.65] font-light text-soft">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
