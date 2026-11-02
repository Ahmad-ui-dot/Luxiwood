import { en } from "./en";
import { ru, type Texts } from "./ru";

export type { Texts };
export type Lang = "ru" | "en";

export const dictionaries: Record<Lang, Texts> = { ru, en };
export const LANGS: Lang[] = ["ru", "en"];
// Выбранный язык хранится в cookie, чтобы сервер сразу отдавал страницу на нужном языке
export const LANG_COOKIE = "lang";

export function toLang(value: string | undefined): Lang {
  return value === "en" ? "en" : "ru";
}
