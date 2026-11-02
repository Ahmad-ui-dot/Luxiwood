import type { Metadata } from "next";
import { LoaderCircle } from "lucide-react";
import { Suspense } from "react";
import { ConfiguratorSection } from "@/features/configurator/components/configurator-section";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.configurator.title };
}

export default function ConstructorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-40">
          <LoaderCircle className="size-7 animate-spin text-primary" />
        </div>
      }
    >
      <ConfiguratorSection />
    </Suspense>
  );
}
