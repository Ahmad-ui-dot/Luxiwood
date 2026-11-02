"use client";

import type { AuthToken } from "@luxiwood/shared";
import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthTabs, Field, FormError, FormMotion, GuestLink, inputClass, PasswordInput, PasswordStrength, SubmitButton } from "./form-parts";
import { LoggedInPanel } from "./logged-in-panel";
import { useT } from "@/lib/i18n";

export function RegisterForm() {
  const t = useT();
  const { user, ready, signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<AuthToken>("/auth/register", {
        method: "POST",
        // Пустой телефон не отправляем: он необязательный
        body: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password },
      });
      signIn(data);
      toast.success(t.auth.register.success, { description: data.user.name });
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setLoading(false);
    }
  }

  if (ready && user) {
    return <LoggedInPanel />;
  }

  return (
    <FormMotion>
      <form onSubmit={handleSubmit} aria-labelledby="register-title" className="flex flex-col gap-5">
        <h2 id="register-title" className="font-heading text-[33px] leading-[1.12] font-normal tracking-[-0.02em]">
          {t.auth.register.title}
        </h2>
        <AuthTabs active="register" />

        <Field label={t.auth.register.name}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.auth.register.namePlaceholder}
            autoComplete="username"
            required
            minLength={2}
            maxLength={50}
            className={inputClass}
          />
        </Field>

        <Field label={t.auth.register.email}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t.auth.register.emailPlaceholder}
            autoComplete="email"
            required
            className={inputClass}
          />
        </Field>

        <Field label={t.auth.register.phone}>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={t.auth.register.phonePlaceholder}
            autoComplete="tel"
            className={inputClass}
          />
        </Field>

        <Field label={t.auth.register.password}>
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t.auth.register.passwordPlaceholder}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </Field>
        <PasswordStrength password={password} />

        <FormError error={error} />
        <SubmitButton loading={loading}>{t.auth.register.submit}</SubmitButton>
        <GuestLink />
      </form>
    </FormMotion>
  );
}
