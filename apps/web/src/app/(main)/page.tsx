import { Suspense } from "react";
import { AssemblySection } from "@/features/home/components/assembly-section";
import { CollectionSection } from "@/features/home/components/collection-section";
import { ConstructorPromo } from "@/features/home/components/constructor-promo";
import { Hero } from "@/features/home/components/hero";
import { HowSection, QuoteSection } from "@/features/home/components/quote-and-how";
import { ReviewsStrip } from "@/features/home/components/reviews-strip";
import { StatsStrip } from "@/features/home/components/stats-strip";

// Главная — как на холсте Luxiwood: 3D-диван, цифры, сборка при прокрутке, конструктор, коллекция, отзывы, цитата, шаги заказа
export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <AssemblySection />
      <ConstructorPromo />
      {/* Товары из API загружаются при каждом запросе, остальная страница отдаётся сразу */}
      <Suspense fallback={<div className="h-[720px]" />}>
        <CollectionSection />
      </Suspense>
      <Suspense fallback={null}>
        <ReviewsStrip />
      </Suspense>
      <QuoteSection />
      <HowSection />
    </>
  );
}
