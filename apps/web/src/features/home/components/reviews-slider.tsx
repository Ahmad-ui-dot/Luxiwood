"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { A11y, Keyboard, Pagination } from "swiper/modules";
import { Swiper, type SwiperClass, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { type Review, Stars } from "@/features/product/components/reviews-section";
import { furnitureTitle } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export type LatestReview = Review & { productName: string; productSlug: string };

const arrowClass =
  "flex size-11 cursor-pointer items-center justify-center rounded-full border border-blueprint/22 bg-card text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-40 disabled:hover:border-blueprint/22 disabled:hover:text-foreground";

// Слайдер отзывов: на компьютере видно 3, на планшете 2, на телефоне 1. Листается свайпом, стрелками и клавиатурой
export function ReviewsSlider({ reviews }: { reviews: LatestReview[] }) {
  const t = useT();
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const updateEdges = (instance: SwiperClass) => setEdges({ start: instance.isBeginning, end: instance.isEnd });

  return (
    <div className="flex flex-col gap-6">
      <Swiper
        modules={[A11y, Keyboard, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        keyboard={{ enabled: true }}
        pagination={{ el: ".reviews-pagination", clickable: true }}
        onSwiper={(instance) => {
          setSwiper(instance);
          updateEdges(instance);
        }}
        onSlideChange={updateEdges}
        onBreakpoint={updateEdges}
        className="w-full"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id} className="!h-auto">
            <article className="bp-frame relative flex h-full flex-col gap-4 border border-blueprint/22 bg-[rgb(255_250_243/0.7)] p-6">
              <Stars value={review.rating} />
              <p className="flex-1 text-base leading-[1.65] font-light text-soft">«{review.text}»</p>
              <div className="flex items-center gap-3 border-t border-[rgb(90_62_40/0.1)] pt-4 text-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 font-semibold text-primary uppercase">{review.authorName[0]}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{review.authorName}</span>
                  <span className="text-xs text-muted-foreground">{t.date(review.createdAt)}</span>
                </span>
                <Link href={`/product/${review.productSlug}`} className="text-right text-muted-foreground transition-colors hover:text-primary">
                  {furnitureTitle(review.productName)}
                </Link>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className={cn("flex items-center justify-between gap-4", edges.start && edges.end && "hidden")}>
        <div className="reviews-pagination flex flex-wrap gap-1 [--swiper-pagination-bullet-inactive-color:var(--muted-foreground)] [--swiper-pagination-color:var(--primary)]" />
        <div className="flex gap-2">
          <button type="button" aria-label={t.common.prevReviews} disabled={edges.start} onClick={() => swiper?.slidePrev()} className={arrowClass}>
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" aria-label={t.common.nextReviews} disabled={edges.end} onClick={() => swiper?.slideNext()} className={arrowClass}>
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
