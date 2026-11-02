import type { Metadata, Viewport } from "next";
import { Onest, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { LangProvider } from "@/lib/i18n";
import { getLang, getT } from "@/lib/i18n-server";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin", "cyrillic"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin", "cyrillic"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: `${t.brand} — ${t.tagline}`, template: `%s · ${t.brand}` },
    description: t.home.heroSub,
  };
}

// На телефоне: панель браузера в цвет фона, страница заходит под «чёлку» — отступы даёт env(safe-area-inset-*)
export const viewport: Viewport = {
  themeColor: "#f6f0e6",
  viewportFit: "cover",
};

// Язык читаем из cookie. С cacheComponents это можно делать только внутри <Suspense>
async function LangRoot({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <LangProvider lang={lang}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
      <Toaster theme="light" position="top-center" />
    </LangProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${onest.variable} ${playfair.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <LangRoot>{children}</LangRoot>
        </Suspense>
      </body>
    </html>
  );
}
