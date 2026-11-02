import type { Metadata } from "next";
import { LoaderCircle } from "lucide-react";
import { Suspense } from "react";
import { CatalogSection } from "@/features/catalog/components/catalog-section";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.catalog.title };
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-40">
          <LoaderCircle className="size-7 animate-spin text-primary" />
        </div>
      }
    >
      <CatalogSection />
    </Suspense>
  );
}
