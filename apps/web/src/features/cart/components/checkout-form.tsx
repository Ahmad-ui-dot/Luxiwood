"use client";

import { isValidPhone, type OrderCreated, type Payment, type PublicSettings } from "@luxiwood/shared";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/select";
import { Field, FormError, inputClass, SubmitButton } from "@/features/auth/components/form-parts";
import { api, ApiError, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// Даты доставки: с завтрашнего дня на две недели вперёд, в формате ГГГГ-ММ-ДД
function deliveryDates(locale: string) {
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { value, label: date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "long" }) };
  });
}

export function CheckoutForm({ onPlaced }: { onPlaced: (order: OrderCreated) => void }) {
  const t = useT();
  const { user, token } = useAuth();
  const { items, clear } = useCart();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [payment, setPayment] = useState<Payment>("CASH");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<PublicSettings>("/settings/public").then(setSettings).catch(() => {});
  }, []);

  // Со входом имя и телефон подставляются из профиля
  useEffect(() => {
    if (user) {
      setName((current) => current || user.name);
      setPhone((current) => current || user.phone || "");
    }
  }, [user]);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const delivery = settings && subtotal < settings.freeDeliveryFrom ? settings.deliveryPrice : 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPhone(phone)) {
      setError(new ApiError({ statusCode: 400, message: t.cart.phoneError }));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const order = await api<OrderCreated>("/orders", {
        method: "POST",
        token,
        body: {
          customerName: name.trim(),
          phone: phone.trim(),
          deliveryDate: date || undefined,
          payment,
          comment: comment.trim() || undefined,
          items: items.map((item) =>
            "productId" in item
              ? {
                  productId: item.productId,
                  mainMaterialId: item.mainMaterialId,
                  colorMaterialId: item.colorMaterialId,
                  woodMaterialId: item.woodMaterialId,
                  sizeId: item.sizeId,
                  quantity: item.quantity,
                }
              : {
                  type: item.type,
                  widthCm: item.widthCm,
                  depthCm: item.depthCm,
                  heightCm: item.heightCm,
                  upholsteryMaterialId: item.upholsteryMaterialId,
                  colorMaterialId: item.colorMaterialId,
                  woodMaterialId: item.woodMaterialId,
                  finishMaterialId: item.finishMaterialId,
                  options: item.options,
                  quantity: item.quantity,
                },
          ),
        },
      });
      onPlaced(order);
      clear();
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setLoading(false);
    }
  }

  const dates = deliveryDates(t.locale);
  const payments: { value: Payment; label: string }[] = [
    { value: "CASH", label: t.cart.payCash },
    { value: "CARD", label: t.cart.payCard },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={t.cart.checkout}
      className="bp-frame relative flex min-w-0 flex-[1_1_380px] flex-col gap-[18px] rounded-xl border border-primary/30 bg-[#f1e9dd] p-6 sm:p-[30px] lg:sticky lg:top-24"
    >
      <h2 className="font-heading text-2xl font-normal tracking-[-0.02em]">{t.cart.summary}</h2>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2.5 text-[15px]">
        <dt className="text-muted-foreground">{t.cart.subtotal}</dt>
        <dd className="text-right tabular-nums">{t.price(subtotal)}</dd>
        <dt className="text-muted-foreground">{t.cart.delivery}</dt>
        <dd className={cn("text-right tabular-nums", delivery === 0 && "text-primary")}>{delivery === 0 ? t.cart.free : t.price(delivery)}</dd>
        <dt className="border-t border-[rgb(90_62_40/0.12)] pt-3 font-bold">{t.cart.total}</dt>
        <dd className="border-t border-[rgb(90_62_40/0.12)] pt-3 text-right text-xl font-bold tabular-nums">{t.price(subtotal + delivery)}</dd>
      </dl>
      {settings && (
        <p className="text-[13px] text-muted-foreground">
          {delivery > 0
            ? `${t.cart.freeLeft}${t.price(settings.freeDeliveryFrom - subtotal)}`
            : `${t.cart.freeFrom}${t.price(settings.freeDeliveryFrom)}`}
        </p>
      )}

      <p className="mt-2 flex items-center gap-2.5 border-t border-blueprint/20 pt-5 text-[13px] font-medium text-blueprint">
        <b className="font-medium text-primary">◆</b>
        {t.cart.checkout}
      </p>

      <Field label={t.cart.name}>
        <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} autoComplete="name" className={inputClass} />
      </Field>
      <Field label={t.cart.phone}>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          placeholder={t.auth.register.phonePlaceholder}
          autoComplete="tel"
          className={inputClass}
        />
      </Field>
      <Field label={t.cart.date}>
        <Select value={date} onValueChange={setDate} options={[{ value: "", label: t.cart.dateAny }, ...dates]} className={inputClass} />
      </Field>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2 text-[13px] font-semibold text-muted-foreground">{t.cart.payment}</legend>
        {payments.map((item) => (
          <label key={item.value} className="flex cursor-pointer items-center gap-3 text-[15px]">
            <input
              type="radio"
              name="payment"
              checked={payment === item.value}
              onChange={() => setPayment(item.value)}
              className="size-[18px] accent-primary"
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      <Field label={t.cart.comment}>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t.cart.commentPlaceholder}
          className={cn(inputClass, "h-auto resize-y py-3.5")}
        />
      </Field>

      <FormError error={error} />
      <SubmitButton loading={loading}>
        {t.cart.placeOrder} · {t.price(subtotal + delivery)}
      </SubmitButton>
    </form>
  );
}
