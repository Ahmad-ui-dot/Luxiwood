"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, FormError, inputClass, SubmitButton } from "@/features/auth/components/form-parts";
import { api, ApiError, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export type Review = { id: number; rating: number; text: string; authorName: string; createdAt: string };
export type Reviews = { ratingAvg: number; reviewsCount: number; items: Review[] };

const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.4l6.6-.8z";

export function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <svg key={index} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d={STAR} fill={index <= value ? "#c0612f" : "rgb(120 88 60 / 0.2)"} />
        </svg>
      ))}
    </span>
  );
}

export function ReviewsSection({ productId }: { productId: number }) {
  const t = useT();
  const { user, token } = useAuth();
  const [data, setData] = useState<Reviews | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    api<Reviews>(`/products/${productId}/reviews`)
      .then(setData)
      .catch(() => {});
  }
  useEffect(load, [productId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!rating) {
      setError(new ApiError({ statusCode: 400, message: t.product.pickRating }));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api(`/products/${productId}/reviews`, { method: "POST", token, body: { rating, text: text.trim() } });
      setRating(0);
      setText("");
      toast.success(t.product.reviewSent);
      load();
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setLoading(false);
    }
  }

  const count = data?.reviewsCount ?? 0;
  const avg = data?.ratingAvg ?? 0;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="mt-14 flex scroll-mt-24 flex-wrap items-start gap-14 border-t border-blueprint/22 pt-14">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-primary">{t.product.reviewsEyebrow}</p>
          <h2 id="reviews-title" className="font-heading text-[clamp(26px,2.4vw,35px)] leading-[1.12] font-normal tracking-[-0.02em]">
            {t.product.reviewsTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <span className="font-heading text-6xl leading-[1.12] tracking-[-0.02em] tabular-nums">{count ? avg.toFixed(1) : "—"}</span>
          <div className="flex flex-col gap-2">
            <Stars value={Math.round(avg)} size={20} />
            <span className="text-sm text-muted-foreground">{t.product.reviewsLink(count)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const amount = data?.items.filter((review) => review.rating === stars).length ?? 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-sm text-soft">
                <span className="w-7">{stars}★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[rgb(90_62_40/0.1)]">
                  <span className="block h-full rounded-[3px] bg-primary transition-[width] duration-500" style={{ width: count ? `${(amount / count) * 100}%` : 0 }} />
                </span>
                <span className="w-5 text-right tabular-nums">{amount}</span>
              </div>
            );
          })}
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px] rounded-xl border border-[rgb(90_62_40/0.1)] bg-[#f1e9dd] p-6">
            <h3 className="font-heading text-[22px] font-normal tracking-[-0.02em]">{t.product.writeReview}</h3>
            <div className="flex flex-col gap-2.5">
              <span id="rating-label" className="text-[13px] font-semibold text-muted-foreground">
                {t.product.yourRating} — <span className="text-foreground">{t.product.ratingWords[rating] || "—"}</span>
              </span>
              <div role="group" aria-labelledby="rating-label" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={t.product.ratingWords[value]}
                    aria-pressed={rating === value}
                    onClick={() => setRating(value)}
                    className="cursor-pointer p-1 transition-transform hover:scale-110"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={STAR} fill={value <= rating ? "#c0612f" : "rgb(120 88 60 / 0.2)"} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <Field label={t.product.reviewText}>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                required
                minLength={10}
                maxLength={2000}
                placeholder={t.product.reviewPlaceholder}
                className={cn(inputClass, "h-auto resize-y py-3.5")}
              />
            </Field>
            <FormError error={error} />
            <SubmitButton loading={loading}>{t.product.sendReview}</SubmitButton>
          </form>
        ) : (
          <p className="rounded-xl border border-dashed border-[rgb(90_62_40/0.2)] p-5 text-[15px] text-soft">
            {t.product.reviewLogin}{" "}
            <Link href="/login" className="text-primary underline">
              {t.nav.login}
            </Link>
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
        {data && data.items.length === 0 && (
          <p className="rounded-xl border border-dashed border-[rgb(90_62_40/0.18)] px-6 py-14 text-center text-[15px] text-muted-foreground">
            {t.product.noReviews}
          </p>
        )}
        {data?.items.map((review) => (
          <article key={review.id} className="flex flex-col gap-4 rounded-xl border border-[rgb(90_62_40/0.1)] bg-[#f1e9dd] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl border border-primary/60 font-heading text-lg text-primary">
                  {review.authorName.charAt(0).toUpperCase()}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold">{review.authorName}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString(t.locale, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>
              <Stars value={review.rating} />
            </div>
            <p className="text-base leading-[1.65] font-light text-[#3a2e25]">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
