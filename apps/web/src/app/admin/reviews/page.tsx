import type { Metadata } from "next";
import { ReviewsPage } from "@/features/admin/components/reviews-page";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.admin.nav.reviews };
}

export default function Page() {
  return <ReviewsPage />;
}
