import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { getT } from "@/lib/i18n-server";

// Иконки преимуществ — как на холсте: избранное, корзина, отзывы, быстрый заказ
const icons = [
  <path key="heart" d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />,
  <g key="cart">
    <path d="M3 5h3l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20.5 8H7" />
    <circle cx="10" cy="19.5" r="1.2" />
    <circle cx="17" cy="19.5" r="1.2" />
  </g>,
  <path key="star" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.4l6.6-.8z" />,
  <path key="bolt" d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z" />,
];

// Страницы входа: слева — зачем нужен аккаунт, справа — форма
export async function AuthShell({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[760px] min-w-0 flex-1 flex-wrap items-stretch">
        <section
          aria-label={t.brand}
          className="relative flex min-w-0 flex-[1_1_480px] flex-col justify-center gap-9 overflow-hidden bg-[radial-gradient(ellipse_70%_60%_at_30%_40%,rgb(192_97_47/0.2)_0%,rgb(192_97_47/0.04)_55%,transparent_80%)] px-[max(24px,5vw)] py-[72px] max-md:pb-[calc(96px+env(safe-area-inset-bottom))]"
        >
          <p
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -left-[2%] font-heading text-[161px] leading-[1.12] tracking-[-0.02em] whitespace-nowrap text-[rgb(90_62_40/0.04)]"
          >
            {t.brand}
          </p>

          <div className="relative flex max-w-[560px] flex-col gap-[18px]">
            <p className="text-xs font-semibold text-primary">{t.auth.eyebrow}</p>
            <h1 className="font-heading text-[clamp(27px,2.85vw,45px)] leading-[1.12] font-normal tracking-[-0.02em] text-balance">
              {t.auth.titleA}
              <span className="font-light text-primary">{t.auth.titleI}</span>
            </h1>
            <p className="text-[17px] leading-[1.6] font-light text-soft">{t.auth.sub}</p>
          </div>

          <ul className="relative grid max-w-[560px] grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
            {t.auth.benefits.map((benefit, index) => (
              <li
                key={benefit.title}
                className="flex flex-col gap-2.5 rounded-xl border border-[rgb(90_62_40/0.1)] bg-[rgb(90_62_40/0.03)] p-5"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c0612f" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                  {icons[index]}
                </svg>
                <span className="text-[15px] font-semibold">{benefit.title}</span>
                <span className="text-sm font-light text-muted-foreground">{benefit.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* На телефоне форма идёт первой — ради неё сюда и пришли */}
        <section className="flex min-w-0 flex-[1_1_440px] items-center justify-center border-l max-lg:order-first border-[rgb(90_62_40/0.08)] bg-[#f1e9dd] px-[max(20px,4vw)] py-14">
          {children}
        </section>
      </main>
      {/* На телефоне меню шапки спрятано — переходы по сайту через нижнюю панель */}
      <MobileTabBar />
    </>
  );
}
