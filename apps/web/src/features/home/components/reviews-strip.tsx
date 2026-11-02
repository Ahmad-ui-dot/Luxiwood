import { Stars } from "@/features/product/components/reviews-section";
import { api } from "@/lib/api";
import { type LatestReview, ReviewsSlider } from "./reviews-slider";
import { getT } from "@/lib/i18n-server";

interface LatestReviews {
  ratingAvg: number;
  reviewsCount: number;
  items: LatestReview[];
}

export async function ReviewsStrip() {
  const t = await getT();
  // Свежие отзывы покупателей. Ошибка API — просто не показываем блок
  const data = await api<LatestReviews>("/reviews/latest").catch(() => null);
  if (!data || data.items.length === 0) return null;

  return (
    <section className="px-[max(20px,4vw)] pt-[60px] pb-[40px]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3.5">
            <p className="text-xs font-semibold text-primary">{t.home.reviewsEyebrow}</p>
            <h2 className="font-heading text-[clamp(25px,2.73vw,42px)] leading-[1.12] font-normal tracking-[-0.02em]">{t.home.reviewsTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-heading text-5xl leading-none tracking-[-0.02em]">{data.ratingAvg.toFixed(1)}</span>
            <span className="flex flex-col gap-1.5">
              <Stars value={Math.round(data.ratingAvg)} />
              <span className="text-sm text-muted-foreground">{t.home.reviewsSummary(data.reviewsCount)}</span>
            </span>
          </div>
        </div>

        <ReviewsSlider reviews={data.items} />
      </div>
    </section>
  );
}
