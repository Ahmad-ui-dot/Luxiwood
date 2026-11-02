"use client";

import Image from "next/image";
import { useT } from "@/lib/i18n";

// Логотип: медное дерево из картинки и название текстом.
// Буквы на картинке светлые и пропадают на светлом фоне, поэтому показываем только дерево (левый квадрат картинки)
export function Logo({ size = 34 }: { size?: number }) {
  const t = useT();
  return (
    <span className="flex items-center gap-2.5">
      <span className="block shrink-0 overflow-hidden" style={{ width: size, height: size }}>
        <Image src="/logo.png" alt="" width={1201} height={263} priority style={{ height: size, width: "auto", maxWidth: "none" }} />
      </span>
      <span className="font-heading leading-none text-foreground" style={{ fontSize: size * 0.85 }}>
        {t.brand}
      </span>
    </span>
  );
}
