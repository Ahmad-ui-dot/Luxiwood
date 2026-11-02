"use client";

import type { Paginated } from "@luxiwood/shared";
import { CalendarDays, ChevronRight, Mail, MapPin, Phone, Receipt, Search, ShoppingBag, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import type { AdminClient, AdminClientDetails } from "../types";
import { useAdminQuery } from "../use-admin";
import { Select } from "@/components/ui/select";
import { Avatar, BackLink, Empty, fieldClass, FilterTabs, Loading, PageTitle, Pagination, Panel, StatusBadge, tableClass, tdClass, thClass } from "./ui";

type Sort = "new" | "spent" | "orders";

export function ClientsPage() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [hasOrders, setHasOrders] = useState<"true" | "false" | "">("");
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ page: String(page), limit: "20", sort });
  if (search.trim()) params.set("search", search.trim());
  if (hasOrders) params.set("hasOrders", hasOrders);
  const { data, error } = useAdminQuery<Paginated<AdminClient>>(`/admin/clients?${params}`);

  // Любой новый фильтр — снова с первой страницы
  function filter(change: () => void) {
    change();
    setPage(1);
  }

  return (
    <>
      <PageTitle title={t.admin.nav.clients} description={data ? t.admin.totalCount(data.total) : undefined} />

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <span className="relative min-w-56 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
            <input
              aria-label={t.admin.search}
              value={search}
              onChange={(event) => filter(() => setSearch(event.target.value))}
              placeholder={t.admin.searchClients}
              className={`${fieldClass} pl-9`}
            />
          </span>
          <span className="w-full sm:w-56">
            <Select
              aria-label={t.admin.sortLabel}
              value={sort}
              onValueChange={(value) => filter(() => setSort(value as Sort))}
              options={[
                { value: "new", label: t.admin.sortNew },
                { value: "spent", label: t.admin.sortSpent },
                { value: "orders", label: t.admin.sortOrders },
              ]}
            />
          </span>
        </div>
        <FilterTabs
          value={hasOrders}
          options={[
            { value: "true" as const, label: t.admin.withOrders },
            { value: "false" as const, label: t.admin.withoutOrders },
          ]}
          onChange={(value) => filter(() => setHasOrders(value))}
        />
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
                    <th className={thClass}>{t.admin.customer}</th>
                    <th className={thClass}>{t.admin.phone}</th>
                    <th className={thClass}>{t.admin.ordersCount}</th>
                    <th className={`${thClass} text-right`}>{t.admin.totalSpent}</th>
                    <th className={thClass}>{t.admin.lastOrder}</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((client, index) => {
                    // Место в рейтинге покупателей — только при сортировке по сумме
                    const rank = sort === "spent" && client.totalSpent > 0 ? (data.page - 1) * data.limit + index + 1 : null;
                    return (
                    <tr key={client.id} className="group transition-colors hover:bg-muted/50">
                      <td className={tdClass}>
                        <Link href={`/admin/clients/${client.id}`} className="flex items-center gap-3">
                          <span className="relative">
                            <Avatar name={client.name} />
                            {rank && rank <= 3 && (
                              <span className="absolute -right-1 -bottom-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                                {rank}
                              </span>
                            )}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="font-medium transition-colors group-hover:text-primary">{client.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{client.email ?? "—"}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{client.phone ?? "—"}</td>
                      <td className={tdClass}>
                        <span className="inline-flex min-w-7 justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">{client.ordersCount}</span>
                      </td>
                      <td className={`${tdClass} text-right font-medium whitespace-nowrap tabular-nums`}>{t.price(client.totalSpent)}</td>
                      <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>
                        {client.lastOrderAt ? t.date(client.lastOrderAt) : <span className="text-xs text-dim">{t.admin.noOrdersYet}</span>}
                      </td>
                      <td className={`${tdClass} w-10 text-right`}>
                        <ChevronRight className="inline size-4 text-dim transition-colors group-hover:text-primary" />
                      </td>
                    </tr>
                    );
                  })}
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

function StatTile({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-lg font-semibold tabular-nums">{value}</span>
      </span>
    </div>
  );
}

export function ClientPage({ id }: { id: number }) {
  const t = useT();
  const { data: client, error } = useAdminQuery<AdminClientDetails>(`/admin/clients/${id}`);
  if (!client) return <Loading error={error} />;

  const averageCheck = client.ordersCount > 0 ? Math.round(client.totalSpent / client.ordersCount) : 0;

  return (
    <>
      <BackLink href="/admin/clients" label={t.admin.nav.clients} />

      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <Avatar name={client.name} className="size-16 text-2xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="font-heading text-[clamp(24px,3vw,32px)] leading-tight">{client.name}</h1>
          <span className="text-sm text-muted-foreground">
            {t.admin.registered}: {t.date(client.createdAt)}
          </span>
        </div>
        {client.phone && (
          <a
            href={`tel:${client.phone.replace(/\s/g, "")}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <Phone className="size-4" />
            {t.admin.call}
          </a>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={ShoppingBag} label={t.admin.ordersCount} value={String(client.ordersCount)} />
        <StatTile icon={Wallet} label={t.admin.totalSpent} value={t.price(client.totalSpent)} />
        <StatTile icon={Receipt} label={t.admin.averageCheck} value={t.price(averageCheck)} />
        <StatTile icon={CalendarDays} label={t.admin.lastOrder} value={client.lastOrderAt ? t.date(client.lastOrderAt) : "—"} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_2fr]">
        <Panel title={t.admin.contacts}>
          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <span className="tabular-nums">{client.phone ?? "—"}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              {client.email ? (
                <a href={`mailto:${client.email}`} className="break-all text-primary hover:underline">
                  {client.email}
                </a>
              ) : (
                "—"
              )}
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>{client.defaultAddress ?? "—"}</span>
            </li>
          </ul>
        </Panel>

        <Panel title={t.admin.clientOrders} action={<span className="text-sm text-muted-foreground">{client.orders.length}</span>}>
          {client.orders.length === 0 ? (
            <Empty />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {client.orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="group flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                    <span className="font-medium transition-colors group-hover:text-primary">{order.number}</span>
                    <span className="flex-1 text-muted-foreground">{t.date(order.createdAt)}</span>
                    <StatusBadge status={order.status} />
                    <span className="w-28 text-right font-medium tabular-nums">{t.price(order.total)}</span>
                    <ChevronRight className="size-4 text-dim transition-colors group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
