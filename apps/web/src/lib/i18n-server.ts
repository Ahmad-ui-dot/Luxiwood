import { cookies } from "next/headers";
import { dictionaries, LANG_COOKIE, toLang } from "@/texts";

// Язык и тексты для серверных компонентов и generateMetadata
export async function getLang() {
  const store = await cookies();
  return toLang(store.get(LANG_COOKIE)?.value);
}

export async function getT() {
  return dictionaries[await getLang()];
}
