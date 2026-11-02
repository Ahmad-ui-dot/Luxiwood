"use client";

import { useLang, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LANGS } from "@/texts";

// Переключатель языка: две «таблетки» RU / EN
export function LanguageSwitch({ className }: { className?: string }) {
  const t = useT();
  const { lang, setLang } = useLang();

  return (
    <div role="group" aria-label={t.language.label} className={cn("flex rounded-full border border-border bg-card p-0.5", className)}>
      {LANGS.map((item) => (
        <button
          key={item}
          type="button"
          lang={item}
          aria-pressed={lang === item}
          title={t.language[item]}
          onClick={() => setLang(item)}
          className={cn(
            "h-8 min-w-9 cursor-pointer rounded-full px-2 text-xs font-semibold uppercase transition-colors",
            lang === item ? "bg-primary text-primary-foreground" : "text-soft hover:text-foreground",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
