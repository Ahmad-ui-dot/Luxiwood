"use client";

import { type Badge, Model3dKey, type ProductKind, type Room, WOOD_MODEL_KEYS } from "@luxiwood/shared";
import { AlignLeft, Banknote, ExternalLink, FileText, Sofa } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PREVIEW_COLORS } from "@/features/viewer3d/models";
import { useThumbnails } from "@/features/viewer3d/use-thumbnails";
import { fileUrl } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AdminCategory, AdminProduct } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { ProductFiles, ProductMaterials, ProductSizes } from "./product-extras";
import { BackLink, ConfirmButton, Field, fieldClass, Loading, PageTitle, Panel, SuffixInput, Switch } from "./ui";

// Поля формы — строки, как в input; в числа превращаем при сохранении
type Form = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  basePrice: string;
  oldPrice: string;
  kind: ProductKind;
  room: Room;
  badge: Badge;
  model3dKey: Model3dKey;
  widthCm: string;
  materialsText: string;
  productionDays: string;
  isActive: boolean;
};

const emptyForm: Form = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  categoryId: "",
  basePrice: "",
  oldPrice: "",
  kind: "FABRIC",
  room: "LIVING",
  badge: "NONE",
  model3dKey: "sofa",
  widthCm: "",
  materialsText: "",
  productionDays: "14",
  isActive: true,
};

function toForm(product: AdminProduct): Form {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description ?? "",
    categoryId: String(product.categoryId),
    basePrice: String(product.basePrice),
    oldPrice: product.oldPrice ? String(product.oldPrice) : "",
    kind: product.kind,
    room: product.room,
    badge: product.badge,
    model3dKey: product.model3dKey,
    widthCm: String(product.widthCm),
    materialsText: product.materialsText ?? "",
    productionDays: String(product.productionDays),
    isActive: product.isActive,
  };
}

// Новый товар (id нет) или изменение существующего. Материалы, размеры и файлы — после первого сохранения
export function ProductForm({ id }: { id?: number }) {
  const t = useT();
  const router = useRouter();
  const { data: product, error, reload } = useAdminQuery<AdminProduct>(id ? `/admin/products/${id}` : null);
  const { data: categories } = useAdminQuery<AdminCategory[]>("/admin/categories");
  const { run, busy } = useAdminAction();
  const [form, setForm] = useState<Form>(emptyForm);
  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }));

  // В превью без фото — 3D-миниатюра выбранного типа мебели
  const thumbnails = useThumbnails(useMemo(() => [{ key: "preview", type: form.model3dKey, colors: PREVIEW_COLORS[form.model3dKey] }], [form.model3dKey]));

  useEffect(() => {
    if (product) setForm(toForm(product));
  }, [product]);

  if (id && !product) return <Loading error={error} />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || undefined,
      categoryId: Number(form.categoryId),
      basePrice: Number(form.basePrice),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : id ? null : undefined,
      kind: form.kind,
      room: form.room,
      badge: form.badge,
      model3dKey: form.model3dKey,
      widthCm: form.widthCm ? Number(form.widthCm) : undefined,
      materialsText: form.materialsText.trim() || undefined,
      productionDays: Number(form.productionDays),
      isActive: form.isActive,
    };
    if (id) {
      if (await run(`/admin/products/${id}`, "PATCH", body, t.admin.saved)) reload();
    } else {
      const created = await run<AdminProduct>("/admin/products", "POST", body, t.admin.created);
      if (created) router.replace(`/admin/products/${created.id}`);
    }
  }

  async function remove() {
    const result = await run<{ message: string }>(`/admin/products/${id}`, "DELETE");
    if (result) {
      // Товар из заказов не удаляется, а скрывается — сервер объясняет это в message
      toast.success(result.message);
      router.push("/admin/products");
    }
  }

  const price = Number(form.basePrice) || 0;
  const oldPrice = Number(form.oldPrice) || 0;
  const discount = oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
  const category = categories?.find((item) => String(item.id) === form.categoryId);
  const photo = product?.images[0];

  return (
    <>
      <BackLink href="/admin/products" label={t.admin.nav.products} />
      <PageTitle title={product ? product.name : t.admin.newProduct} description={product ? `${t.admin.sku}: ${product.sku}` : undefined}>
        {product && (
          <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}>
            <ExternalLink />
            {t.admin.onSite}
          </a>
        )}
      </PageTitle>

      <form onSubmit={handleSubmit} className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t.admin.main} icon={FileText}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.admin.name} className="sm:col-span-2">
                <input required value={form.name} onChange={(event) => set({ name: event.target.value })} className={fieldClass} />
              </Field>
              <Field label={t.admin.slug} hint={t.admin.slugHint}>
                <input required value={form.slug} onChange={(event) => set({ slug: event.target.value })} className={fieldClass} />
              </Field>
              <Field label={t.admin.sku}>
                <input required value={form.sku} onChange={(event) => set({ sku: event.target.value })} className={fieldClass} />
              </Field>
              <Field label={t.admin.category}>
                <Select
                  required
                  value={form.categoryId}
                  onValueChange={(categoryId) => set({ categoryId })}
                  placeholder="—"
                  options={(categories ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
                />
              </Field>
              <Field label={t.admin.room}>
                <Select
                  value={form.room}
                  onValueChange={(room) => set({ room: room as Room })}
                  options={(Object.keys(t.labels.room) as Room[]).map((room) => ({ value: room, label: t.labels.room[room] }))}
                />
              </Field>
            </div>
          </Panel>

          <Panel title={t.admin.pricing} icon={Banknote}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.admin.price}>
                <SuffixInput suffix={t.currency} required type="number" min={0} value={form.basePrice} onChange={(event) => set({ basePrice: event.target.value })} />
              </Field>
              <Field label={t.admin.oldPrice} hint={discount > 0 ? `${t.admin.discount}: −${discount}%` : undefined}>
                <SuffixInput suffix={t.currency} type="number" min={0} value={form.oldPrice} onChange={(event) => set({ oldPrice: event.target.value })} />
              </Field>
              <Field label={t.admin.productionDays}>
                <SuffixInput
                  suffix={t.catalog.daysShort}
                  required
                  type="number"
                  min={1}
                  max={120}
                  value={form.productionDays}
                  onChange={(event) => set({ productionDays: event.target.value })}
                />
              </Field>
              <Field label={t.admin.badge}>
                <Select
                  value={form.badge}
                  onValueChange={(badge) => set({ badge: badge as Badge })}
                  options={[
                    { value: "NONE", label: t.admin.badgeNone },
                    { value: "HIT", label: t.admin.badgeHit },
                    { value: "NEW", label: t.admin.badgeNew },
                  ]}
                />
              </Field>
            </div>
          </Panel>

          <Panel title={t.admin.details} icon={Sofa}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.admin.model}>
                <Select
                  value={form.model3dKey}
                  // У нового товара основной материал подбираем по типу: шкаф и стол — дерево, диван — ткань
                  onValueChange={(value) => {
                    const model3dKey = value as Model3dKey;
                    set(id ? { model3dKey } : { model3dKey, kind: WOOD_MODEL_KEYS.includes(model3dKey) ? "WOOD" : "FABRIC" });
                  }}
                  options={Object.values(Model3dKey).map((key) => ({ value: key, label: t.labels.model[key] }))}
                />
              </Field>
              <Field label={t.admin.kind}>
                <Select
                  value={form.kind}
                  onValueChange={(kind) => set({ kind: kind as ProductKind })}
                  options={[
                    { value: "FABRIC", label: t.admin.kindFabric },
                    { value: "WOOD", label: t.admin.kindWood },
                  ]}
                />
              </Field>
              <Field label={t.admin.widthCm}>
                <SuffixInput suffix={t.catalog.cm} type="number" min={10} max={500} value={form.widthCm} onChange={(event) => set({ widthCm: event.target.value })} />
              </Field>
              <Field label={t.admin.materialsText}>
                <input value={form.materialsText} onChange={(event) => set({ materialsText: event.target.value })} className={fieldClass} />
              </Field>
            </div>
          </Panel>

          <Panel title={t.admin.description} icon={AlignLeft}>
            <textarea
              aria-label={t.admin.description}
              rows={5}
              value={form.description}
              onChange={(event) => set({ description: event.target.value })}
              className={`${fieldClass} h-auto py-2.5 leading-relaxed`}
            />
          </Panel>
        </div>

        {/* Справа превью и кнопки — на широком экране остаются на месте при прокрутке */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Panel title={t.admin.preview}>
            <div className="relative overflow-hidden rounded-xl bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,#f7efe3_0%,#fffaf3_70%)]">
              {photo ? (
                <img src={fileUrl(photo)} alt="" className={cn("aspect-[4/3] w-full object-cover", !form.isActive && "opacity-50 grayscale")} />
              ) : thumbnails.preview ? (
                <img src={thumbnails.preview} alt="" className={cn("aspect-[4/3] w-full object-contain", !form.isActive && "opacity-50 grayscale")} />
              ) : (
                <span className="flex aspect-[4/3] items-center justify-center text-dim">
                  <Sofa className="size-8" />
                </span>
              )}
              <span className="absolute top-3 left-3 flex gap-1.5">
                {form.badge !== "NONE" && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">{form.badge === "HIT" ? t.admin.badgeHit : t.admin.badgeNew}</span>
                )}
                {discount > 0 && <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">−{discount}%</span>}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {category ? `${category.name} · ` : ""}
                {t.labels.model[form.model3dKey]}
              </span>
              <span className="font-semibold">{form.name || "—"}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-lg font-semibold tabular-nums">{t.price(price)}</span>
                {discount > 0 && <s className="text-xs text-dim tabular-nums">{t.price(oldPrice)}</s>}
              </span>
            </div>
            <div className="border-t border-border pt-4">
              <Switch checked={form.isActive} onChange={(isActive) => set({ isActive })} label={t.admin.isActive} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {t.admin.save}
            </Button>
            {id && (
              <ConfirmButton description={t.admin.deleteProductHint} onConfirm={remove} disabled={busy}>
                {t.admin.deleteProduct}
              </ConfirmButton>
            )}
          </Panel>
        </aside>
      </form>

      {product ? (
        <>
          <ProductFiles product={product} onSaved={reload} />
          <ProductMaterials product={product} onSaved={reload} />
          <ProductSizes product={product} onSaved={reload} />
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">{t.admin.saveFirst}</p>
      )}
    </>
  );
}
