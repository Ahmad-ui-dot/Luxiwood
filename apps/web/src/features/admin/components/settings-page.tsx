"use client";

import { CONFIGURATOR_TYPES, type ConfiguratorKey } from "@luxiwood/shared";
import { Ruler, Store, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import type { AdminSettings } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { Field, fieldClass, Loading, PageTitle, Panel, SuffixInput } from "./ui";

// Поле цены с подписью валюты внутри
function PriceInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const t = useT();
  return <SuffixInput suffix={t.currency} type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} />;
}

export function SettingsPage() {
  const t = useT();
  const { data, error, reload } = useAdminQuery<AdminSettings>("/admin/settings");
  const { run, busy } = useAdminAction();
  const [form, setForm] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (!form || !data) return <Loading error={error} />;

  const dirty = JSON.stringify(form) !== JSON.stringify(data);
  const set = (patch: Partial<AdminSettings>) => setForm({ ...form, ...patch });
  const setBase = (type: ConfiguratorKey, value: number) => set({ configuratorBasePrices: { ...form.configuratorBasePrices, [type]: value } });
  const setOption = (key: string, value: number) => set({ configuratorOptionPrices: { ...form.configuratorOptionPrices, [key]: value } });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (await run("/admin/settings", "PATCH", form, t.admin.saved)) reload();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-20">
      <PageTitle title={t.admin.nav.settings}>
        <Button type="submit" size="lg" className="px-5" disabled={busy || !dirty}>
          {t.admin.save}
        </Button>
      </PageTitle>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.admin.deliveryTitle} icon={Truck}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.admin.deliveryCost}>
              <PriceInput value={form.deliveryPrice} onChange={(deliveryPrice) => set({ deliveryPrice })} />
            </Field>
            <Field label={t.admin.freeFrom}>
              <PriceInput value={form.freeDeliveryFrom} onChange={(freeDeliveryFrom) => set({ freeDeliveryFrom })} />
            </Field>
          </div>
        </Panel>

        <Panel title={t.admin.workshop} icon={Store}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.admin.workshopPhone}>
              <input value={form.workshopPhone} onChange={(event) => set({ workshopPhone: event.target.value })} className={fieldClass} />
            </Field>
            <Field label={t.admin.workshopHours}>
              <input value={form.workshopHours} onChange={(event) => set({ workshopHours: event.target.value })} className={fieldClass} />
            </Field>
          </div>
        </Panel>
      </div>

      <Panel title={t.admin.configuratorTitle} icon={Ruler}>
        <p className="text-sm text-muted-foreground">{t.admin.configuratorHint}</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.values(CONFIGURATOR_TYPES).map((config) => (
            <div key={config.type} className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="font-semibold">{t.labels.model[config.type]}</h3>
              <Field label={t.admin.basePriceOf}>
                <PriceInput value={form.configuratorBasePrices[config.type]} onChange={(value) => setBase(config.type, value)} />
              </Field>
              <div className="flex flex-col gap-3 border-t border-border pt-3">
                {config.options.map((option) => (
                  <Field key={option.key} label={t.labels.options[option.key] ?? option.label}>
                    <PriceInput value={form.configuratorOptionPrices[option.key] ?? 0} onChange={(value) => setOption(option.key, value)} />
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Плашка внизу экрана — только когда есть несохранённые изменения */}
      {dirty && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-lg">
          <span className="text-sm font-medium">{t.admin.unsaved}</span>
          <span className="flex gap-2">
            <Button type="button" variant="ghost" size="lg" onClick={() => setForm(data)}>
              {t.admin.discard}
            </Button>
            <Button type="submit" size="lg" className="px-5" disabled={busy}>
              {t.admin.save}
            </Button>
          </span>
        </div>
      )}
    </form>
  );
}
