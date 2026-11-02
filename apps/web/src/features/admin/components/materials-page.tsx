"use client";

import type { MaterialType } from "@luxiwood/shared";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminMaterial } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { actionsTdClass, ConfirmButton, Empty, Field, fieldClass, FilterTabs, FormDialog, IconButton, Loading, PageTitle, Panel, tableClass, tdClass, thClass } from "./ui";
import { useT } from "@/lib/i18n";

const TYPES: MaterialType[] = ["FABRIC", "COLOR", "WOOD", "FINISH"];
const emptyForm = { name: "", hex: "#C29A6B", priceDelta: "0" };

export function MaterialsPage() {
  const t = useT();
  const typeOptions = TYPES.map((type) => ({ value: type, label: t.admin.materialTypes[type] }));
  const [type, setType] = useState<MaterialType>("FABRIC");
  const { data, error, reload } = useAdminQuery<AdminMaterial[]>(`/admin/materials?type=${type}`);
  const { run, busy } = useAdminAction();
  const [open, setOpen] = useState(false);
  // null — добавляем новый материал, иначе — меняем этот
  const [editing, setEditing] = useState<AdminMaterial | null>(null);
  const [form, setForm] = useState(emptyForm);
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  function openForm(material: AdminMaterial | null) {
    setEditing(material);
    setForm(material ? { name: material.name, hex: material.hex, priceDelta: String(material.priceDelta) } : emptyForm);
    setOpen(true);
  }

  async function save() {
    const body = { name: form.name.trim(), hex: form.hex.toUpperCase(), priceDelta: Number(form.priceDelta) };
    const result = editing
      ? await run(`/admin/materials/${editing.id}`, "PATCH", body, t.admin.saved)
      : await run("/admin/materials", "POST", { ...body, type }, t.admin.saved);
    if (result) {
      setOpen(false);
      reload();
    }
  }

  async function toggleActive(material: AdminMaterial) {
    if (await run(`/admin/materials/${material.id}`, "PATCH", { isActive: !material.isActive }, t.admin.saved)) reload();
  }

  async function remove(material: AdminMaterial) {
    if (await run(`/admin/materials/${material.id}`, "DELETE", undefined, t.admin.deleted)) reload();
  }

  return (
    <>
      <PageTitle title={t.admin.nav.materials} description={data ? t.admin.totalCount(data.length) : undefined}>
        <Button size="lg" className="px-4" onClick={() => openForm(null)}>
          <Plus />
          {t.admin.newMaterial}
        </Button>
      </PageTitle>
      <FilterTabs value={type} options={typeOptions} withAll={false} onChange={(value) => value && setType(value)} />

      {!data ? (
        <Loading error={error} />
      ) : (
        <Panel>
          {data.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>{t.admin.name}</th>
                    <th className={thClass}>HEX</th>
                    <th className={`${thClass} text-right`}>{t.admin.priceDelta}</th>
                    <th className={thClass}>{t.admin.inProducts}</th>
                    <th className={thClass}>{t.admin.status}</th>
                    <th className={`${thClass} text-right`}>{t.admin.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((material) => (
                    <tr key={material.id} className="transition-colors hover:bg-muted/50">
                      <td className={tdClass}>
                        <span className="flex items-center gap-3">
                          <span className="size-7 shrink-0 rounded-full border border-border" style={{ backgroundColor: material.hex }} />
                          <span className={cn("font-medium", !material.isActive && "text-muted-foreground")}>{material.name}</span>
                        </span>
                      </td>
                      <td className={`${tdClass} text-muted-foreground uppercase`}>{material.hex}</td>
                      <td className={`${tdClass} text-right whitespace-nowrap tabular-nums`}>{material.priceDelta ? `+${t.price(material.priceDelta)}` : "—"}</td>
                      <td className={`${tdClass} tabular-nums`}>{material.productsCount}</td>
                      <td className={tdClass}>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs", material.isActive ? "bg-emerald-500/15 text-emerald-800" : "bg-muted text-muted-foreground")}>
                          {material.isActive ? t.admin.active : t.admin.off}
                        </span>
                      </td>
                      <td className={actionsTdClass}>
                        <IconButton label={t.admin.edit} onClick={() => openForm(material)}>
                          <Pencil />
                        </IconButton>
                        <IconButton label={material.isActive ? t.admin.turnOff : t.admin.turnOn} disabled={busy} onClick={() => toggleActive(material)}>
                          {material.isActive ? <EyeOff /> : <Eye />}
                        </IconButton>
                        <ConfirmButton icon onConfirm={() => remove(material)} disabled={busy}>
                          {t.admin.delete}
                        </ConfirmButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? t.admin.editMaterial : `${t.admin.newMaterial} · ${t.admin.materialTypes[type]}`}
        busy={busy}
        onSubmit={save}
      >
        <Field label={t.admin.name}>
          <input required autoFocus value={form.name} onChange={(event) => set({ name: event.target.value })} className={fieldClass} />
        </Field>
        <Field label={t.admin.color}>
          <span className="flex gap-2">
            <input
              type="color"
              aria-label={t.admin.color}
              value={form.hex.toLowerCase()}
              onChange={(event) => set({ hex: event.target.value })}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-input bg-card p-1"
            />
            <input aria-label="HEX" value={form.hex} onChange={(event) => set({ hex: event.target.value })} className={`${fieldClass} uppercase`} />
          </span>
        </Field>
        <Field label={t.admin.priceDelta}>
          <input type="number" value={form.priceDelta} onChange={(event) => set({ priceDelta: event.target.value })} className={fieldClass} />
        </Field>
      </FormDialog>
    </>
  );
}
