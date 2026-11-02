"use client";

import { ORDER_STATUS_FLOW, type Order, type Paginated } from "@luxiwood/shared";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { furnitureTitle } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyTab } from "./empty-tab";
import { useT } from "@/lib/i18n";

export function OrdersTab() {
  const t = useT();
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api<Paginated<Order>>("/me/orders?limit=50", { token })
      .then((data) => setOrders(data.items))
      .catch((error) => {
        toast.error(toApiError(error).message);
        setOrders([]);
      });
  }, [token]);

  async function cancel(order: Order) {
    if (!confirm(t.account.cancelConfirm)) {
      return;
    }
    try {
      const updated = await api<Order>(`/me/orders/${order.number}/cancel`, { method: "POST", token });
      setOrders((list) => list?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
      toast.success(t.account.cancelled);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  if (!orders) {
    return <LoaderCircle className="mx-auto my-16 size-6 animate-spin text-primary" />;
  }
  if (orders.length === 0) {
    return <EmptyTab title={t.account.noOrders} text={t.account.noOrdersSub} />;
  }

  return (
    <div className="flex flex-col gap-[18px]">
      {orders.map((order) => {
        const cancelled = order.status === "CANCELLED";
        const stageIndex = ORDER_STATUS_FLOW.indexOf(order.status);
        return (
          <article key={order.id} className="flex flex-col gap-[22px] rounded-xl border border-[rgb(90_62_40/0.1)] bg-[#f1e9dd] px-5 py-6 sm:px-[30px] sm:py-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="font-heading text-[22px] leading-[1.12] tracking-[-0.02em]">{order.number}</p>
                <p className="text-sm text-muted-foreground">
                  {t.account.orderOf} {t.date(order.createdAt)} · {t.account.delivery}:{" "}
                  {order.deliveryDate ? t.date(order.deliveryDate) : t.account.deliveryUnknown}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-[13px] font-bold",
                    cancelled ? "bg-[rgb(181_83_42/0.12)] text-[#b5532a]" : "bg-primary/15 text-primary",
                  )}
                >
                  {t.account.nowStage}: {t.labels.status[order.status]}
                </span>
                <span className="text-xl font-bold tabular-nums">{t.price(order.total)}</span>
              </div>
            </div>

            {!cancelled && (
              <ol aria-label={order.number} className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {ORDER_STATUS_FLOW.map((status, index) => (
                  <li key={status} className="flex flex-col gap-2">
                    <span className={cn("h-1.5 rounded-[3px]", index <= stageIndex ? "bg-primary" : "bg-[rgb(90_62_40/0.12)]")} />
                    <span className={cn("text-xs", index === stageIndex ? "font-bold text-foreground" : index < stageIndex ? "text-soft" : "text-dim")}>
                      {t.labels.status[status]}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <ul className="flex flex-col gap-2 border-t border-[rgb(90_62_40/0.08)] pt-[18px]">
              {order.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline gap-x-2.5 text-[15px] text-[#3a2e25]">
                  <span className="flex-1">
                    {furnitureTitle(item.title)}
                    {item.options.length > 0 && <span className="text-sm text-muted-foreground"> · {item.options.join(", ")}</span>}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {item.quantity} × {t.price(item.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>

            {order.status === "NEW" && (
              <button
                type="button"
                onClick={() => cancel(order)}
                className="cursor-pointer self-start text-sm text-muted-foreground underline transition-colors hover:text-[#b5532a]"
              >
                {t.account.cancel}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}
