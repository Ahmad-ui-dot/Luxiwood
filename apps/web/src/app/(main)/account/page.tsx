import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountView } from "@/features/account/components/account-view";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.account.title };
}

export default function AccountPage() {
  // Вкладка берётся из адреса (?tab=wishlist), поэтому нужен Suspense
  return (
    <Suspense fallback={null}>
      <AccountView />
    </Suspense>
  );
}
