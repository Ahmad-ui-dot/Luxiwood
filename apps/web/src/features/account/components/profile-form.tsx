"use client";

import type { User } from "@luxiwood/shared";
import { useState } from "react";
import { toast } from "sonner";
import { Field, FormError, inputClass, SubmitButton } from "@/features/auth/components/form-parts";
import { api, type ApiError, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export const panelClass = "flex flex-col gap-[18px] rounded-xl border border-[rgb(90_62_40/0.1)] bg-[#f1e9dd] p-5 sm:p-[30px]";

export function ProfileForm() {
  const t = useT();
  const { user, token, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.defaultAddress ?? "");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      return;
    }
    // Отправляем только изменённые поля. Телефон сервер хранит без пробелов
    const body: Record<string, string> = {};
    if (name.trim() !== user.name) body.name = name.trim();
    if (email.trim().toLowerCase() !== (user.email ?? "")) body.email = email.trim();
    if (phone.trim() && phone.replace(/\s/g, "") !== user.phone) body.phone = phone.trim();
    if (address.trim() !== (user.defaultAddress ?? "")) body.defaultAddress = address.trim();

    if (Object.keys(body).length === 0) {
      toast(t.account.noChanges);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await api<User>("/auth/me", { method: "PATCH", body, token });
      updateUser(updated);
      setPhone(updated.phone ?? "");
      toast.success(t.account.saved);
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="profile-title" className={panelClass}>
      <div className="flex flex-col gap-1.5">
        <h2 id="profile-title" className="font-heading text-xl tracking-[-0.02em]">
          {t.account.profileTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{t.account.profileText}</p>
      </div>
      <Field label={t.account.name}>
        <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={50} autoComplete="username" className={inputClass} />
      </Field>
      <Field label={t.account.email}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="name@gmail.com" autoComplete="email" className={inputClass} />
      </Field>
      <Field label={t.account.phone}>
        <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t.auth.register.phonePlaceholder} autoComplete="tel" className={inputClass} />
      </Field>
      <Field label={t.account.address}>
        <input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={300} placeholder={t.account.addressPlaceholder} autoComplete="street-address" className={inputClass} />
      </Field>
      <FormError error={error} />
      <SubmitButton loading={loading}>{t.account.save}</SubmitButton>
    </form>
  );
}
