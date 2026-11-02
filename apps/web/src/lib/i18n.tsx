"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { dictionaries, type Lang, LANG_COOKIE } from "@/texts";

const LangContext = createContext<Lang>("ru");

// Язык приходит из корневого layout (он читает cookie), поэтому сервер и браузер рисуют одно и то же
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  // <html lang> сервер отдаёт статичным — обновляем его здесь, для экранных дикторов и переводчиков браузера
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

// Тексты для клиентских компонентов: const t = useT();
export function useT() {
  return dictionaries[useContext(LangContext)];
}

// Текущий язык и переключение: запоминаем в cookie на год и перерисовываем страницу с сервера
export function useLang() {
  const lang = useContext(LangContext);
  const router = useRouter();

  function setLang(next: Lang) {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return { lang, setLang };
}
