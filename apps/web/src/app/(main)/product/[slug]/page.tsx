import type { ProductDetails } from "@luxiwood/shared";
import type { Metadata } from "next";
import { LoaderCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductView } from "@/features/product/components/product-view";
import { api, ApiError } from "@/lib/api";
import { furnitureTitle } from "@/lib/format";
import { getT } from "@/lib/i18n-server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getT();
  const product = await api<ProductDetails>(`/products/${slug}`).catch(() => null);
  return { title: product ? furnitureTitle(product.name) : t.catalog.title };
}

async function ProductSection({ params }: Props) {
  const { slug } = await params;
  const product = await api<ProductDetails>(`/products/${slug}`).catch((error) => {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  });
  return <ProductView product={product} />;
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-40">
          <LoaderCircle className="size-7 animate-spin text-primary" />
        </div>
      }
    >
      <ProductSection params={params} />
    </Suspense>
  );
}
