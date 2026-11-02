"use client";

import { ArrowDown, ArrowRight, ArrowUp, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import type { AdminCategory } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { ConfirmButton, Empty, Field, fieldClass, FormDialog, IconButton, Loading, PageTitle, Panel } from "./ui";

const emptyForm = { name: "", slug: "" };

export function CategoriesPage() {
  const t = useT();
  const { data, error, reload } = useAdminQuery<AdminCategory[]>("/admin/categories");
  const { run, busy } = useAdminAction();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  // null — добавляем новую категорию, иначе — меняем эту
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  if (!data) return <Loading error={error} />;

  const categories = [...data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const query = search.trim().toLowerCase();
  const shown = query ? categories.filter((category) => `${category.name} ${category.slug}`.toLowerCase().includes(query)) : categories;
  const maxProducts = Math.max(...categories.map((category) => category.productsCount), 1);

  function openForm(category: AdminCategory | null) {
    setEditing(category);
    setForm(category ? { name: category.name, slug: category.slug } : emptyForm);
    setOpen(true);
  }

  async function save() {
    const body = { name: form.name.trim(), slug: form.slug.trim() };
    // Новая категория встаёт в конец списка
    const result = editing
      ? await run(`/admin/categories/${editing.id}`, "PATCH", body, t.admin.saved)
      : await run("/admin/categories", "POST", { ...body, sortOrder: categories.length + 1 }, t.admin.saved);
    if (result) {
      setOpen(false);
      reload();
    }
  }

  // Меняем местами с соседом и сохраняем порядок 1, 2, 3… — только у тех, у кого он изменился
  async function move(index: number, direction: -1 | 1) {
    const next = [...categories];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    for (const [position, category] of next.entries()) {
      if (category.sortOrder !== position + 1) await run(`/admin/categories/${category.id}`, "PATCH", { sortOrder: position + 1 });
    }
    reload();
  }

  async function remove(category: AdminCategory) {
    if (await run(`/admin/categories/${category.id}`, "DELETE", undefined, t.admin.deleted)) reload();
  }

  return (
    <>
      <PageTitle title={t.admin.nav.categories} description={t.admin.totalCount(data.length)}>
        <span className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
          <input aria-label={t.admin.search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.admin.searchCategories} className={`${fieldClass} pl-9`} />
        </span>
        <Button size="lg" className="px-4" onClick={() => openForm(null)}>
          <Plus />
          {t.admin.newCategory}
        </Button>
      </PageTitle>

      {shown.length === 0 ? (
        <Panel>
          <Empty />
        </Panel>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {shown.map((category) => {
            const index = categories.indexOf(category);
            return (
              <article key={category.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                <header className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-heading text-lg text-primary">{category.name[0]}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{category.name}</span>
                    <span className="truncate font-mono text-xs text-muted-foreground">/{category.slug}</span>
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">#{index + 1}</span>
                </header>

                <div className="flex flex-col gap-2">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{t.admin.productsCount}</span>
                    <span className="text-lg font-semibold tabular-nums">{category.productsCount}</span>
                  </span>
                  <span className="h-1.5 rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(category.productsCount / maxProducts) * 100}%` }} />
                  </span>
                  {category.productsCount === 0 && <span className="text-xs text-dim">{t.admin.emptyCategory}</span>}
                </div>

                <footer className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                  <Link href={`/admin/products?categoryId=${category.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    {t.admin.categoryProducts}
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <span className="flex items-center">
                    {/* Порядок меняем только в полном списке, без поиска — иначе непонятно, с кем меняемся */}
                    {!query && (
                      <>
                        <IconButton label={t.admin.moveUp} disabled={busy || index === 0} onClick={() => move(index, -1)}>
                          <ArrowUp />
                        </IconButton>
                        <IconButton label={t.admin.moveDown} disabled={busy || index === categories.length - 1} onClick={() => move(index, 1)}>
                          <ArrowDown />
                        </IconButton>
                      </>
                    )}
                    <IconButton label={t.admin.edit} onClick={() => openForm(category)}>
                      <Pencil />
                    </IconButton>
                    {category.productsCount > 0 ? (
                      <span title={t.admin.hasProductsHint}>
                        <ConfirmButton icon disabled onConfirm={() => remove(category)}>
                          {t.admin.delete}
                        </ConfirmButton>
                      </span>
                    ) : (
                      <ConfirmButton icon onConfirm={() => remove(category)} disabled={busy}>
                        {t.admin.delete}
                      </ConfirmButton>
                    )}
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <FormDialog open={open} onOpenChange={setOpen} title={editing ? t.admin.editCategory : t.admin.newCategory} busy={busy} onSubmit={save}>
        <Field label={t.admin.name}>
          <input required autoFocus minLength={2} value={form.name} onChange={(event) => set({ name: event.target.value })} className={fieldClass} />
        </Field>
        <Field label={t.admin.slug} hint={t.admin.slugHint}>
          <input required value={form.slug} onChange={(event) => set({ slug: event.target.value })} className={fieldClass} />
        </Field>
      </FormDialog>
    </>
  );
}
