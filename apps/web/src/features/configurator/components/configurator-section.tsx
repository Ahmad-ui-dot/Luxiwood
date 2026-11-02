import type { ConfiguratorOptions } from "@luxiwood/shared";
import { api } from "@/lib/api";
import { ConfiguratorView } from "./configurator-view";
import { getT } from "@/lib/i18n-server";

// Типы, материалы и цены конструктора — одним запросом, дальше всё считается в браузере
export async function ConfiguratorSection() {
  const t = await getT();
  const data = await api<ConfiguratorOptions>("/configurator/options").catch(() => null);

  if (!data) {
    return <p className="mx-auto max-w-[1280px] px-[max(20px,4vw)] py-32 text-center text-muted-foreground">{t.configurator.loadError}</p>;
  }
  return <ConfiguratorView types={data.types} />;
}
