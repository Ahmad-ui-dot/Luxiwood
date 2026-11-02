"use client";

import { Banknote, ClipboardList, Hammer, Inbox, type LucideIcon, Package, Plus, Receipt, ShoppingBag, Sofa, Star, TrendingDown, TrendingUp, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { fileUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { MonthCompare, Stats, TopProduct } from "../types";
import { useAdminQuery } from "../use-admin";
import { FilterTabs, Loading, PageTitle, Panel, StatusBadge, tableClass, tdClass, thClass } from "./ui";
import { useT } from "@/lib/i18n";

// Изменение к прошлому месяцу: зелёная плашка — рост, красная — падение
function Change({ compare, format }: { compare: MonthCompare; format: (value: number) => string }) {
  const t = useT();
  if (compare.changePercent === null) {
    return <span className="text-xs text-muted-foreground">{t.admin.prevMonth(format(compare.previous))}</span>;
  }
  const up = compare.changePercent >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium", up ? "bg-emerald-500/12 text-emerald-700" : "bg-destructive/10 text-destructive")}>
        <Icon className="size-3.5" />
        {up ? "+" : "−"}
        {Math.abs(compare.changePercent)}%
      </span>
      {t.admin.vsLastMonth}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, children }: { icon: LucideIcon; label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <span className="font-heading text-[32px] leading-none tracking-[-0.02em] tabular-nums">{value}</span>
      {children}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: React.ReactNode; href?: string }) {
  const content = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-soft">
        <Icon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-lg font-semibold tabular-nums">{value}</span>
      </span>
    </>
  );
  const className = "flex items-center gap-3 rounded-2xl border border-border bg-card p-4";
  if (!href) return <div className={className}>{content}</div>;
  return (
    <Link href={href} className={cn(className, "transition-colors hover:border-primary/40")}>
      {content}
    </Link>
  );
}

// Столбчатая диаграмма одной серии: сетка, подписи и подсказка при наведении на столбик
function BarChart({ bars, showLabel = () => true }: { bars: { key: string; label: string; title: string; value: number; note: string }[]; showLabel?: (index: number) => boolean }) {
  const t = useT();
  const compactNumber = new Intl.NumberFormat(t.locale, { notation: "compact", maximumFractionDigits: 1 });
  const max = Math.max(...bars.map((bar) => bar.value), 0);
  // «Круглый» верх шкалы: 37 400 → 40 000
  const step = max > 0 ? 10 ** Math.floor(Math.log10(max)) : 1;
  const top = max > 0 ? Math.ceil(max / step) * step : 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex h-52">
        <div className="flex w-12 shrink-0 flex-col justify-between pb-px text-right text-[11px] text-dim tabular-nums">
          <span className="-translate-y-1/2">{compactNumber.format(top)}</span>
          <span>{compactNumber.format(top / 2)}</span>
          <span className="translate-y-1/2">0</span>
        </div>
        <div className="relative ml-3 flex flex-1 items-end gap-[2px] border-b border-border">
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
          {max === 0 && <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{t.admin.noSales}</span>}
          {bars.map((bar) => (
            <div key={bar.key} className="group relative flex h-full flex-1 items-end justify-center">
              {bar.value > 0 && (
                <span className="pointer-events-none absolute bottom-full z-10 mb-2 flex flex-col items-center rounded-lg bg-foreground px-2.5 py-1.5 text-xs whitespace-nowrap text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <span className="font-medium">{bar.title}</span>
                  <span>{t.price(bar.value)}</span>
                  <span className="opacity-70">{bar.note}</span>
                </span>
              )}
              <div
                className="w-full max-w-9 rounded-t-[4px] bg-primary transition-colors group-hover:bg-primary/75"
                style={{ height: `${(bar.value / top) * 100}%`, minHeight: bar.value > 0 ? 4 : 0 }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="ml-15 flex gap-[2px] text-center text-[11px] text-muted-foreground">
        {bars.map((bar, index) => (
          <span key={bar.key} className="flex-1 truncate">
            {showLabel(index) ? bar.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Ranking({ products }: { products: TopProduct[] }) {
  const t = useT();
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Inbox className="size-5" />
        </span>
        {t.admin.noSales}
      </div>
    );
  }
  const totalRevenue = products.reduce((total, product) => total + product.revenue, 0);
  const maxQuantity = products[0].quantity;

  return (
    <ol className="flex flex-col divide-y divide-border">
      {products.map((product, index) => (
        <li key={product.productId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
              index < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {index + 1}
          </span>
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-dim">
            {product.image ? <img src={fileUrl(product.image)} alt="" className="size-full object-cover" /> : <Sofa className="size-5" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-3">
              <Link href={`/admin/products/${product.productId}`} className="truncate text-sm font-medium transition-colors hover:text-primary">
                {product.name}
              </Link>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{t.price(product.revenue)}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="h-1.5 flex-1 rounded-full bg-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(product.quantity / maxQuantity) * 100}%` }} />
              </span>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {product.quantity} {t.admin.pcs} · {totalRevenue > 0 ? Math.round((product.revenue / totalRevenue) * 100) : 0}%
              </span>
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function OverviewPage() {
  const t = useT();
  const { data, error } = useAdminQuery<Stats>("/admin/stats");
  const [period, setPeriod] = useState<"month" | "all">("month");
  if (!data) return <Loading error={error} />;

  // Месяц приходит как «2026-11» — подпись берём из словаря, чтобы она была на выбранном языке
  const monthIndex = (month: string) => Number(month.slice(5)) - 1;
  const currentMonth = data.revenueByMonth[data.revenueByMonth.length - 1].month;
  const monthShort = t.labels.months[monthIndex(currentMonth)];
  const monthLabel = `${t.labels.monthsFull[monthIndex(currentMonth)]} ${currentMonth.slice(0, 4)}`;
  const ordersTotal = data.ordersByStatus.reduce((total, item) => total + item.count, 0);
  const maxStatus = Math.max(...data.ordersByStatus.map((item) => item.count), 1);
  const maxTypeRevenue = Math.max(...data.salesByType.map((item) => item.revenue), 1);
  const pcs = (value: number) => `${value} ${t.admin.pcs}`;

  return (
    <>
      <PageTitle title={t.admin.nav.overview} description={t.admin.overviewHint(monthLabel)}>
        <Link href="/admin/orders" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}>
          <ClipboardList />
          {t.admin.nav.orders}
        </Link>
        <Link href="/admin/products/new" className={cn(buttonVariants({ size: "lg" }), "px-4")}>
          <Plus />
          {t.admin.newProduct}
        </Link>
      </PageTitle>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Banknote} label={t.admin.revenue} value={t.price(data.revenue.current)}>
          <Change compare={data.revenue} format={t.price} />
        </KpiCard>
        <KpiCard icon={ShoppingBag} label={t.admin.ordersMonth} value={String(data.orders.current)}>
          <Change compare={data.orders} format={String} />
        </KpiCard>
        <KpiCard icon={Package} label={t.admin.itemsSold} value={pcs(data.itemsSold.current)}>
          <Change compare={data.itemsSold} format={pcs} />
        </KpiCard>
        <KpiCard icon={UserPlus} label={t.admin.newClients} value={String(data.newClients.current)}>
          <Change compare={data.newClients} format={String} />
        </KpiCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={Receipt} label={t.admin.averageCheck} value={t.price(data.averageCheck)} />
        <MiniStat icon={Inbox} label={t.admin.newOrders} value={data.newOrders} href="/admin/orders" />
        <MiniStat icon={Hammer} label={t.admin.inWork} value={data.inWork} href="/admin/orders" />
        <MiniStat
          icon={Star}
          label={t.admin.shopRating}
          value={
            <>
              {data.rating.average.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">· {t.admin.reviewsOf(data.rating.count)}</span>
            </>
          }
          href="/admin/reviews"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold">{t.admin.revenueByDay}</h2>
            <span className="text-sm text-muted-foreground">{t.admin.monthTotal(t.price(data.revenue.current), data.orders.current)}</span>
          </div>
          <BarChart
            bars={data.revenueByDay.map((day) => ({
              key: String(day.day),
              label: String(day.day),
              title: t.admin.dayOf(day.day, monthShort),
              value: day.revenue,
              note: t.admin.orderCount(day.orders),
            }))}
            // Подписываем 1-е число и каждое пятое, чтобы подписи не налезали друг на друга
            showLabel={(index) => index === 0 || (index + 1) % 5 === 0}
          />
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold">{t.admin.ordersByStatus}</h2>
            <span className="text-sm text-muted-foreground">{ordersTotal}</span>
          </div>
          <ul className="flex flex-col gap-3.5">
            {data.ordersByStatus.map((item) => (
              <li key={item.status} className="flex items-center gap-3">
                <span className="w-28 shrink-0">
                  <StatusBadge status={item.status} />
                </span>
                <span className="h-1.5 flex-1 rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(item.count / maxStatus) * 100}%` }} />
                </span>
                <span className="w-6 text-right text-sm font-medium tabular-nums">{item.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{t.admin.salesRanking}</h2>
            <FilterTabs
              value={period}
              withAll={false}
              options={[
                { value: "month" as const, label: t.admin.periodMonth },
                { value: "all" as const, label: t.admin.periodAll },
              ]}
              onChange={(value) => value && setPeriod(value)}
            />
          </div>
          <Ranking products={period === "month" ? data.monthTopProducts : data.topProducts} />
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title={t.admin.revenueByMonth}>
            <BarChart
              bars={data.revenueByMonth.map((month) => ({
                key: month.month,
                label: t.labels.months[monthIndex(month.month)],
                title: t.labels.monthsFull[monthIndex(month.month)],
                value: month.revenue,
                note: t.admin.orderCount(month.orders),
              }))}
            />
          </Panel>

          <Panel title={t.admin.salesByType}>
            {data.salesByType.length === 0 && <p className="text-sm text-muted-foreground">{t.admin.noSales}</p>}
            <ul className="flex flex-col gap-3">
              {data.salesByType.map((item) => (
                <li key={item.type} className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span>
                      {t.labels.model[item.type]} <span className="text-muted-foreground">· {pcs(item.quantity)}</span>
                    </span>
                    <span className="font-medium tabular-nums">{t.price(item.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(item.revenue / maxTypeRevenue) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">{t.admin.monthPurchases}</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
            {t.admin.allOrders}
          </Link>
        </div>
        {data.monthPurchases.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">{t.admin.noSales}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>{t.admin.date}</th>
                  <th className={thClass}>{t.admin.number}</th>
                  <th className={thClass}>{t.admin.customer}</th>
                  <th className={thClass}>{t.admin.product}</th>
                  <th className={`${thClass} text-right`}>{t.admin.quantity}</th>
                  <th className={`${thClass} text-right`}>{t.admin.total}</th>
                  <th className={thClass}>{t.admin.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.monthPurchases.map((purchase, index) => (
                  <tr key={`${purchase.orderId}-${index}`} className="transition-colors hover:bg-muted/50">
                    <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>{t.date(purchase.createdAt)}</td>
                    <td className={tdClass}>
                      <Link href={`/admin/orders/${purchase.orderId}`} className="font-medium whitespace-nowrap text-primary hover:underline">
                        {purchase.number}
                      </Link>
                    </td>
                    <td className={tdClass}>{purchase.customerName}</td>
                    <td className={tdClass}>
                      {purchase.productId ? (
                        <Link href={`/admin/products/${purchase.productId}`} className="transition-colors hover:text-primary">
                          {purchase.title}
                        </Link>
                      ) : (
                        purchase.title
                      )}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{purchase.quantity}</td>
                    <td className={`${tdClass} text-right font-medium whitespace-nowrap tabular-nums`}>{t.price(purchase.total)}</td>
                    <td className={tdClass}>
                      <StatusBadge status={purchase.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
