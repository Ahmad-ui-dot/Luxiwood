import type { Metadata } from "next";
import { WishlistView } from "@/features/account/components/wishlist-view";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.wishlist.title };
}

export default function WishlistPage() {
  return <WishlistView />;
}
