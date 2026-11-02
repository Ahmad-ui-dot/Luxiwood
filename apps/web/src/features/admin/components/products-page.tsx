"use client";

import { type Paginated } from "@luxiwood/shared";
import { Clock, ExternalLink, Eye, EyeOff, LayoutGrid, List, Pencil, Plus, Ruler, Search, Sofa, Star } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PREVIEW_COLORS } from "@/features/viewer3d/models";
import { useThumbnails } from "@/features/viewer3d/use-thumbnails";
import { fileUrl } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AdminCategory, AdminProductRow } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { actionsTdClass, ConfirmButton, Empty, Field, fieldClass, IconButton, Loading, PageTitle, Pagination, Panel, tableClass, tdClass, thClass } from "./ui";

type View = "cards" | "table";

// Скидка в процентах: 8900 вместо 9900 → 10
function discountPercent(product: AdminProductRow) {
  return product.oldPrice ? Math.round((1 - product.basePrice / product.oldPrice) * 100) : 0;
}

// Фото товара; если фото нет — 3D-миниатюра его модели; пока она рисуется — иконка
function ProductImage({ product, thumbnail, className }: { product: AdminProductRow; thumbnail?: string; className?: string }) {
  const photo = product.images[0];
  return (
    <span className={cn("flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,#f7efe3_0%,#fffaf3_70%)] text-dim", className)}>
      {photo ? (
        <img src={fileUrl(photo)} alt="" className="size-full object-cover" />
      ) : thumbnail ? (
        <img src={thumbnail} alt="" className="size-full object-contain" />
      ) : (
        <Sofa className="size-6" />
      )}
    </span>
  );
}

function StatusChip({ active }: { active: boolean }) {
  const t = useT();
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-500/15 text-emerald-800" : "bg-muted text-muted-foreground")}>
      {active ? t.admin.visible : t.admin.hidden}
    </span>
  );
}

function ProductCard({
  product,
  thumbnail,
  busy,
  onToggle,
  onRemove,
}: {
  product: AdminProductRow;
  thumbnail?: string;
  busy: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const discount = discountPercent(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40">
      <Link href={`/admin/products/${product.id}`} className="relative block">
        <ProductImage product={product} thumbnail={thumbnail} className={cn("aspect-[4/3] w-full transition-opacity", !product.isActive && "opacity-50 grayscale")} />
        <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.badge !== "NONE" && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">{product.badge === "HIT" ? t.admin.badgeHit : t.admin.badgeNew}</span>
          )}
          {discount > 0 && <span className="rounded-full bg-foreground px-2.5 py-0.5 text-xs font-semibold text-background">−{discount}%</span>}
        </span>
        <span className="absolute top-3 right-3">
          <StatusChip active={product.isActive} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {product.category.name} · {t.labels.model[product.model3dKey]}
          </span>
          <Link href={`/admin/products/${product.id}`} className="font-semibold leading-snug transition-colors hover:text-primary">
            {product.name}
          </Link>
          <span className="text-xs text-dim">
            {t.admin.sku}: {product.sku}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Ruler className="size-3.5" />
            {product.widthCm} {t.catalog.cm}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {product.productionDays} {t.catalog.daysShort}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" />
            {product.reviewsCount > 0 ? `${product.ratingAvg.toFixed(1)} · ${t.product.reviewsLink(product.reviewsCount)}` : t.product.reviewsLink(0)}
          </span>
          <span>{t.labels.room[product.room]}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          <span className="flex flex-col">
            {product.oldPrice && <s className="text-xs text-dim tabular-nums">{t.price(product.oldPrice)}</s>}
            <span className="text-lg font-semibold tabular-nums">{t.price(product.basePrice)}</span>
          </span>
          <span className="flex items-center">
            <Link
              href={`/admin/products/${product.id}`}
              aria-label={t.admin.edit}
              title={t.admin.edit}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
            >
              <Pencil />
            </Link>
            <a
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              aria-label={t.admin.onSite}
              title={t.admin.onSite}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
            >
              <ExternalLink />
            </a>
            <IconButton label={product.isActive ? t.admin.hide : t.admin.show} disabled={busy} onClick={onToggle}>
              {product.isActive ? <EyeOff /> : <Eye />}
            </IconButton>
            <ConfirmButton icon description={t.admin.deleteProductHint} onConfirm={onRemove} disabled={busy}>
              {t.admin.delete}
            </ConfirmButton>
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductsPage() {
  const t = useT();
  const [view, setView] = useState<View>("cards");
  const [search, setSearch] = useState("");
  // Со страницы категорий приходим с ?categoryId=3 — сразу показываем товары этой категории
  const searchParams = useSearchParams();
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search.trim()) params.set("search", search.trim());
  if (categoryId) params.set("categoryId", categoryId);
  if (isActive) params.set("isActive", isActive);
  const { data, error, reload } = useAdminQuery<Paginated<AdminProductRow>>(`/admin/products?${params}`);
  const { data: categories } = useAdminQuery<AdminCategory[]>("/admin/categories");
  const { run, busy } = useAdminAction();

  // 3D-миниатюры только для товаров без фото
  const thumbnails = useThumbnails(
    useMemo(
      () =>
        (data?.items ?? [])
          .filter((product) => product.images.length === 0)
          .map((product) => ({ key: product.slug, type: product.model3dKey, colors: PREVIEW_COLORS[product.model3dKey] })),
      [data],
    ),
  );

  function filter(change: () => void) {
    change();
    setPage(1);
  }

  async function toggleActive(product: AdminProductRow) {
    if (await run(`/admin/products/${product.id}`, "PATCH", { isActive: !product.isActive }, t.admin.saved)) reload();
  }

  async function remove(product: AdminProductRow) {
    const result = await run<{ message: string }>(`/admin/products/${product.id}`, "DELETE");
    if (result) {
      // Товар из заказов не удаляется, а скрывается — сервер объясняет это в message
      toast.success(result.message);
      reload();
    }
  }

  const viewOptions = [
    { value: "cards" as const, label: t.admin.viewCards, icon: LayoutGrid },
    { value: "table" as const, label: t.admin.viewTable, icon: List },
  ];

  return (
    <>
      <PageTitle title={t.admin.nav.products} description={data ? t.admin.totalCount(data.total) : undefined}>
        <div role="group" className="flex rounded-lg border border-border bg-card p-0.5">
          {viewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={view === option.value}
              aria-label={option.label}
              title={option.label}
              onClick={() => setView(option.value)}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors",
                view === option.value ? "bg-primary/12 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <option.icon className="size-4" />
            </button>
          ))}
        </div>
        <Link href="/admin/products/new" className={cn(buttonVariants({ size: "lg" }), "px-4")}>
          <Plus />
          {t.admin.newProduct}
        </Link>
      </PageTitle>

      <Panel>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label={t.admin.search}>
            <span className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
              <input value={search} onChange={(event) => filter(() => setSearch(event.target.value))} placeholder={t.admin.searchProducts} className={`${fieldClass} pl-9`} />
            </span>
          </Field>
          <Field label={t.admin.category}>
            <Select
              value={categoryId}
              onValueChange={(value) => filter(() => setCategoryId(value))}
              options={[{ value: "", label: t.admin.all }, ...(categories ?? []).map((category) => ({ value: String(category.id), label: category.name }))]}
            />
          </Field>
          <Field label={t.admin.visible}>
            <Select
              value={isActive}
              onValueChange={(value) => filter(() => setIsActive(value))}
              options={[
                { value: "", label: t.admin.all },
                { value: "true", label: t.admin.visible },
                { value: "false", label: t.admin.hidden },
              ]}
            />
          </Field>
        </div>
      </Panel>

      {!data ? (
        <Loading error={error} />
      ) : data.items.length === 0 ? (
        <Panel>
          <Empty />
        </Panel>
      ) : view === "cards" ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            {data.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                thumbnail={thumbnails[product.slug]}
                busy={busy}
                onToggle={() => toggleActive(product)}
                onRemove={() => remove(product)}
              />
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>{t.admin.product}</th>
                  <th className={thClass}>{t.admin.category}</th>
                  <th className={thClass}>{t.admin.model}</th>
                  <th className={`${thClass} text-right`}>{t.admin.price}</th>
                  <th className={thClass}>{t.admin.visible}</th>
                  <th className={`${thClass} text-right`}>{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-muted/50">
                    <td className={tdClass}>
                      <span className="flex items-center gap-3">
                        <ProductImage product={product} thumbnail={thumbnails[product.slug]} className={cn("size-12 shrink-0 rounded-lg", !product.isActive && "opacity-50 grayscale")} />
                        <span className="flex min-w-0 flex-col">
                          <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-primary hover:underline">
                            {product.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">{product.sku}</span>
                        </span>
                      </span>
                    </td>
                    <td className={tdClass}>{product.category.name}</td>
                    <td className={tdClass}>{t.labels.model[product.model3dKey]}</td>
                    <td className={`${tdClass} text-right whitespace-nowrap tabular-nums`}>
                      {t.price(product.basePrice)}
                      {product.oldPrice && <s className="ml-2 text-xs text-dim">{t.price(product.oldPrice)}</s>}
                    </td>
                    <td className={tdClass}>
                      <StatusChip active={product.isActive} />
                    </td>
                    <td className={actionsTdClass}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        aria-label={t.admin.edit}
                        title={t.admin.edit}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
                      >
                        <Pencil />
                      </Link>
                      <IconButton label={product.isActive ? t.admin.hide : t.admin.show} disabled={busy} onClick={() => toggleActive(product)}>
                        {product.isActive ? <EyeOff /> : <Eye />}
                      </IconButton>
                      <ConfirmButton icon description={t.admin.deleteProductHint} onConfirm={() => remove(product)} disabled={busy}>
                        {t.admin.delete}
                      </ConfirmButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </Panel>
      )}
    </>
  );
}
