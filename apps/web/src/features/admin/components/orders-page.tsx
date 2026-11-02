"use client";

import { type OrderStatus, type Paginated } from "@luxiwood/shared";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminOrderRow } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { actionsTdClass, Avatar, ConfirmButton, Empty, Field, fieldClass, FilterTabs, Loading, PageTitle, Pagination, Panel, StatusBadge, tableClass, tdClass, thClass } from "./ui";
import { useT } from "@/lib/i18n";

export function OrdersPage() {
  const t = useT();
  const statusOptions = (Object.keys(t.labels.status) as OrderStatus[]).map((status) => ({ value: status, label: t.labels.status[status] }));
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  if (search.trim()) params.set("search", search.trim());
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const { data, error, reload } = useAdminQuery<Paginated<AdminOrderRow>>(`/admin/orders?${params}`);
  const { run, busy } = useAdminAction();

  async function remove(order: AdminOrderRow) {
    if (await run(`/admin/orders/${order.id}`, "DELETE", undefined, t.admin.deleted)) reload();
  }

  // Любой новый фильтр — снова с первой страницы
  function filter(change: () => void) {
    change();
    setPage(1);
  }

  return (
    <>
      <PageTitle title={t.admin.nav.orders} description={data ? t.admin.totalCount(data.total) : undefined} />

      <Panel>
        <FilterTabs value={status} options={statusOptions} onChange={(value) => filter(() => setStatus(value))} />
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <Field label={t.admin.search}>
            <span className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
              <input value={search} onChange={(event) => filter(() => setSearch(event.target.value))} placeholder={t.admin.searchOrders} className={`${fieldClass} pl-9`} />
            </span>
          </Field>
          <Field label={t.admin.from}>
            <input type="date" value={dateFrom} onChange={(event) => filter(() => setDateFrom(event.target.value))} className={fieldClass} />
          </Field>
          <Field label={t.admin.to}>
            <input type="date" value={dateTo} onChange={(event) => filter(() => setDateTo(event.target.value))} className={fieldClass} />
          </Field>
        </div>
      </Panel>

      {!data ? (
        <Loading error={error} />
      ) : (
        <Panel>
          {data.items.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>{t.admin.number}</th>
                    <th className={thClass}>{t.admin.date}</th>
                    <th className={thClass}>{t.admin.customer}</th>
                    <th className={thClass}>{t.admin.status}</th>
                    <th className={thClass}>{t.admin.items}</th>
                    <th className={thClass}>{t.admin.delivery}</th>
                    <th className={`${thClass} text-right`}>{t.admin.total}</th>
                    <th className={`${thClass} text-right`}>{t.admin.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-muted/50">
                      <td className={tdClass}>
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                          {order.number}
                        </Link>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>{t.date(order.createdAt)}</td>
                      <td className={tdClass}>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={order.customerName} className="size-8 text-xs" />
                          <span className="flex min-w-0 flex-col">
                            <span className="font-medium">{order.customerName}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{order.phone}</span>
                          </span>
                        </span>
                      </td>
                      <td className={tdClass}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className={tdClass}>{order.itemsCount}</td>
                      <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>{order.deliveryDate ? t.date(order.deliveryDate) : "—"}</td>
                      <td className={`${tdClass} text-right whitespace-nowrap tabular-nums`}>{t.price(order.total)}</td>
                      <td className={actionsTdClass}>
                        <Link href={`/admin/orders/${order.id}`} aria-label={t.admin.open} title={t.admin.open} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}>
                          <Eye />
                        </Link>
                        {/* Сервер удаляет только отменённые заказы */}
                        {order.status === "CANCELLED" && (
                          <ConfirmButton icon description={t.admin.deleteOrderHint} onConfirm={() => remove(order)} disabled={busy}>
                            {t.admin.delete}
                          </ConfirmButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </Panel>
      )}
    </>
  );
}
