"use client";

import { ORDER_STATUS_FLOW, type OrderStatus, orderStatusChangeError } from "@luxiwood/shared";
import { Check, ChevronRight, History, MapPin, MessageSquareQuote, Package, Pencil, Phone, Route, StickyNote, Trash2, TriangleAlert, User, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AdminOrder } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { Avatar, BackLink, ConfirmButton, Field, fieldClass, Loading, PageTitle, Panel, StatusBadge } from "./ui";

// Шкала этапов: пройденные — с галочкой, текущий — выделен, будущие — серые
function StatusSteps({ status }: { status: OrderStatus }) {
  const t = useT();
  const current = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <ol className="flex overflow-x-auto pb-1">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex min-w-24 flex-1 flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", index === 0 ? "bg-transparent" : index <= current ? "bg-primary" : "bg-border")} />
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary/12 text-primary",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <span className={cn("h-0.5 flex-1", index === ORDER_STATUS_FLOW.length - 1 ? "bg-transparent" : index < current ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("text-xs", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{t.labels.status[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderPage({ id }: { id: number }) {
  const t = useT();
  const router = useRouter();
  const { data: order, error, reload } = useAdminQuery<AdminOrder>(`/admin/orders/${id}`);
  const { run, busy } = useAdminAction();
  const [note, setNote] = useState("");
  const [contacts, setContacts] = useState({ customerName: "", phone: "", address: "", deliveryDate: "" });

  // Когда заказ загрузился (или обновился) — заполняем поля формы
  useEffect(() => {
    if (!order) return;
    setNote(order.adminNote ?? "");
    setContacts({ customerName: order.customerName, phone: order.phone, address: order.address, deliveryDate: order.deliveryDate ?? "" });
  }, [order]);

  if (!order) return <Loading error={error} />;

  const isFinal = order.status === "DONE" || order.status === "CANCELLED";
  // Разрешённые переходы — та же проверка, что на сервере. Первый из них по порядку — «следующий этап»
  const allowed = ORDER_STATUS_FLOW.filter((status) => status !== order.status && orderStatusChangeError(order.status, status) === null);
  const nextStatus = allowed.find((status) => ORDER_STATUS_FLOW.indexOf(status) > ORDER_STATUS_FLOW.indexOf(order.status));
  const otherStatuses = allowed.filter((status) => status !== nextStatus);
  const canCancel = orderStatusChangeError(order.status, "CANCELLED") === null;

  async function changeStatus(status: OrderStatus) {
    if (await run(`/admin/orders/${id}/status`, "PATCH", { status }, t.admin.statusChanged)) reload();
  }

  async function saveNote() {
    if (await run(`/admin/orders/${id}/note`, "PATCH", { adminNote: note }, t.admin.saved)) reload();
  }

  async function saveContacts(event: React.FormEvent) {
    event.preventDefault();
    // Пустой адрес не отправляем: покупатель мог оформить заказ без адреса
    const body = { ...contacts, address: contacts.address.trim() || undefined, deliveryDate: contacts.deliveryDate || null };
    if (await run(`/admin/orders/${id}`, "PATCH", body, t.admin.saved)) reload();
  }

  async function remove() {
    if (await run(`/admin/orders/${id}`, "DELETE", undefined, t.admin.deleted)) router.push("/admin/orders");
  }

  return (
    <>
      <BackLink href="/admin/orders" label={t.admin.nav.orders} />
      <PageTitle title={t.admin.orderTitle(order.number)} description={`${t.admin.placedAt} ${t.date(order.createdAt)}`}>
        <StatusBadge status={order.status} />
        <span className="font-heading text-2xl tabular-nums">{t.price(order.total)}</span>
      </PageTitle>

      <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t.admin.orderProgress} icon={Route}>
            {order.status === "CANCELLED" ? (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">{t.labels.status.CANCELLED}</p>
            ) : (
              <StatusSteps status={order.status} />
            )}
            {isFinal ? (
              <p className="text-sm text-muted-foreground">{t.admin.finalStatus}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                {nextStatus && (
                  <Button size="lg" className="px-4" disabled={busy} onClick={() => changeStatus(nextStatus)}>
                    {t.admin.nextStep}: {t.labels.status[nextStatus]}
                    <ChevronRight />
                  </Button>
                )}
                {otherStatuses.map((status) => (
                  <Button key={status} variant="outline" size="lg" disabled={busy} onClick={() => changeStatus(status)}>
                    {t.labels.status[status]}
                  </Button>
                ))}
                {canCancel && (
                  <Button variant="destructive" size="lg" className="ml-auto" disabled={busy} onClick={() => changeStatus("CANCELLED")}>
                    {t.admin.cancelOrder}
                  </Button>
                )}
              </div>
            )}
          </Panel>

          <Panel title={t.admin.items} icon={Package} action={<span className="text-sm text-muted-foreground">{order.items.length}</span>}>
            <ul className="flex flex-col divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold text-soft">×{item.quantity}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      {item.productId ? (
                        <Link href={`/admin/products/${item.productId}`} className="font-medium transition-colors hover:text-primary">
                          {item.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{item.title}</span>
                      )}
                      <span className="font-semibold whitespace-nowrap tabular-nums">{t.price(item.unitPrice * item.quantity)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {item.quantity} × {t.price(item.unitPrice)}
                    </span>
                    {item.snapshot?.breakdown && (
                      <ul className="flex flex-col gap-0.5 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                        {item.snapshot.breakdown.map((line) => (
                          <li key={line.label} className="flex justify-between gap-3">
                            <span>{line.label}</span>
                            <span className="tabular-nums">{t.price(line.amount)}</span>
                          </li>
                        ))}
                        {item.snapshot.days && <li className="pt-1">{t.admin.days(item.snapshot.days)}</li>}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
              <dt className="text-muted-foreground">{t.admin.subtotal}</dt>
              <dd className="text-right tabular-nums">{t.price(order.subtotal)}</dd>
              <dt className="text-muted-foreground">{t.admin.deliveryPrice}</dt>
              <dd className="text-right tabular-nums">{t.price(order.deliveryPrice)}</dd>
              <dt className="border-t border-border pt-2 font-semibold">{t.admin.total}</dt>
              <dd className="border-t border-border pt-2 text-right text-base font-semibold tabular-nums">{t.price(order.total)}</dd>
            </dl>
          </Panel>

          <Panel title={t.admin.note} icon={StickyNote}>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t.admin.notePlaceholder} rows={3} className={`${fieldClass} h-auto py-2`} />
            <Button className="self-start" disabled={busy || note === (order.adminNote ?? "")} onClick={saveNote}>
              {t.admin.save}
            </Button>
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={t.admin.customer} icon={User}>
            <div className="flex items-center gap-3">
              <Avatar name={order.customerName} className="size-11 text-base" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{order.customerName}</span>
                {order.userId ? (
                  <Link href={`/admin/clients/${order.userId}`} className="text-xs text-primary hover:underline">
                    #{order.userId}
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">{t.admin.guest}</span>
                )}
              </div>
              <a href={`tel:${order.phone.replace(/\s/g, "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15">
                <Phone className="size-4" />
                {t.admin.call}
              </a>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <span className="tabular-nums">{order.phone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {order.address ? (
                  <span>{order.address}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-800">
                    <TriangleAlert className="size-3.5" />
                    {t.admin.noAddress}
                  </span>
                )}
              </li>
              <li className="flex items-center gap-2.5">
                <Wallet className="size-4 shrink-0 text-muted-foreground" />
                {order.payment === "CARD" ? t.admin.payCard : t.admin.payCash}
                <span className="text-muted-foreground">· {order.deliveryDate ? t.date(order.deliveryDate) : t.account.deliveryUnknown}</span>
              </li>
            </ul>
            {order.comment && (
              <blockquote className="flex gap-2.5 rounded-xl bg-muted/60 p-3 text-sm text-soft">
                <MessageSquareQuote className="size-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="block text-xs text-muted-foreground">{t.admin.comment}</span>
                  {order.comment}
                </span>
              </blockquote>
            )}
          </Panel>

          <Panel title={t.admin.contacts} icon={Pencil}>
            <form onSubmit={saveContacts} className="flex flex-col gap-3">
              <Field label={t.admin.customer}>
                <input value={contacts.customerName} disabled={isFinal} onChange={(event) => setContacts({ ...contacts, customerName: event.target.value })} className={fieldClass} />
              </Field>
              <Field label={t.admin.phone}>
                <input value={contacts.phone} disabled={isFinal} onChange={(event) => setContacts({ ...contacts, phone: event.target.value })} className={fieldClass} />
              </Field>
              <Field label={t.admin.address}>
                <input value={contacts.address} disabled={isFinal} onChange={(event) => setContacts({ ...contacts, address: event.target.value })} className={fieldClass} />
              </Field>
              <Field label={t.admin.deliveryDate}>
                <input type="date" value={contacts.deliveryDate} disabled={isFinal} onChange={(event) => setContacts({ ...contacts, deliveryDate: event.target.value })} className={fieldClass} />
              </Field>
              {!isFinal && (
                <Button type="submit" className="self-start" disabled={busy}>
                  {t.admin.save}
                </Button>
              )}
            </form>
          </Panel>

          <Panel title={t.admin.history} icon={History}>
            <ol className="flex flex-col">
              {order.history.map((entry, index) => {
                const last = index === order.history.length - 1;
                return (
                  <li key={`${entry.status}-${entry.changedAt}`} className="relative flex gap-3 pb-4 last:pb-0">
                    {!last && <span className="absolute top-3 left-[5px] h-full w-px bg-border" />}
                    <span className={cn("relative mt-1 size-2.5 shrink-0 rounded-full", last ? "bg-primary ring-4 ring-primary/15" : "bg-muted-foreground/40")} />
                    <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className={cn(last && "font-medium")}>{t.labels.status[entry.status]}</span>
                      <span className="text-xs text-muted-foreground">{new Date(entry.changedAt).toLocaleString(t.locale, { dateStyle: "short", timeStyle: "short" })}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </Panel>

          <Panel title={t.admin.dangerZone} icon={Trash2}>
            {order.status === "CANCELLED" ? (
              <ConfirmButton description={t.admin.deleteOrderHint} onConfirm={remove} disabled={busy}>
                {t.admin.deleteOrder}
              </ConfirmButton>
            ) : (
              <p className="text-sm text-muted-foreground">{t.admin.deleteOnlyCancelled}</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
