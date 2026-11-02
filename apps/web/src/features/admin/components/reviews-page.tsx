"use client";

import type { Paginated } from "@luxiwood/shared";
import { Eye, EyeOff, Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Stars } from "@/features/product/components/reviews-section";
import { cn } from "@/lib/utils";
import type { AdminReview } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { ConfirmButton, Empty, FilterTabs, IconButton, Loading, PageTitle, Pagination } from "./ui";
import { useT } from "@/lib/i18n";

function ReviewCard({ review, busy, onToggle, onRemove }: { review: AdminReview; busy: boolean; onToggle: () => void; onRemove: () => void }) {
  const t = useT();
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-colors",
        review.isApproved ? "border-border hover:border-primary/30" : "border-dashed border-border bg-muted/40",
      )}
    >
      <header className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 font-semibold text-primary uppercase">{review.authorName[0]}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium">{review.authorName}</span>
            <span className="text-xs text-muted-foreground">{t.date(review.createdAt)}</span>
          </span>
          <Stars value={review.rating} size={14} />
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            review.isApproved ? "bg-emerald-500/15 text-emerald-800" : "bg-muted text-muted-foreground",
          )}
        >
          {review.isApproved ? t.admin.shown : t.admin.hidden}
        </span>
      </header>

      <p className={cn("flex-1 text-sm leading-relaxed", review.isApproved ? "text-soft" : "text-muted-foreground")}>«{review.text}»</p>

      <footer className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Link
          href={`/admin/products/${review.productId}`}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-soft transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <Package className="size-3.5 shrink-0" />
          <span className="truncate">{review.productName}</span>
        </Link>
        <span className="flex shrink-0 items-center">
          <IconButton label={review.isApproved ? t.admin.hide : t.admin.show} disabled={busy} onClick={onToggle}>
            {review.isApproved ? <EyeOff /> : <Eye />}
          </IconButton>
          <ConfirmButton icon onConfirm={onRemove} disabled={busy}>
            {t.admin.delete}
          </ConfirmButton>
        </span>
      </footer>
    </article>
  );
}

export function ReviewsPage() {
  const t = useT();
  const approvedOptions = [
    { value: "true" as const, label: t.admin.shown },
    { value: "false" as const, label: t.admin.hidden },
  ];
  const [approved, setApproved] = useState<"true" | "false" | "">("");
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (approved) params.set("isApproved", approved);
  const { data, error, reload } = useAdminQuery<Paginated<AdminReview>>(`/admin/reviews?${params}`);
  const { run, busy } = useAdminAction();

  async function toggle(review: AdminReview) {
    if (await run(`/admin/reviews/${review.id}`, "PATCH", { isApproved: !review.isApproved }, t.admin.saved)) reload();
  }

  async function remove(review: AdminReview) {
    if (await run(`/admin/reviews/${review.id}`, "DELETE", undefined, t.admin.deleted)) reload();
  }

  return (
    <>
      <PageTitle title={t.admin.nav.reviews} description={data ? t.admin.totalCount(data.total) : undefined} />
      <FilterTabs
        value={approved}
        options={approvedOptions}
        onChange={(value) => {
          setApproved(value);
          setPage(1);
        }}
      />

      {!data ? (
        <Loading error={error} />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <Empty />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((review) => (
              <ReviewCard key={review.id} review={review} busy={busy} onToggle={() => toggle(review)} onRemove={() => remove(review)} />
            ))}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
