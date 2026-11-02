"use client";

import type { AuthToken } from "@luxiwood/shared";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthTabs, Field, FormError, FormMotion, GuestLink, inputClass, PasswordInput, SubmitButton } from "./form-parts";
import { LoggedInPanel } from "./logged-in-panel";
import { useT } from "@/lib/i18n";

export function LoginForm() {
  const t = useT();
  const { user, ready, signIn } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<AuthToken>("/auth/login", { method: "POST", body: { login: login.trim(), password } });
      signIn(data);
      toast.success(t.auth.login.success, { description: data.user.name });
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
      <form onSubmit={handleSubmit} aria-labelledby="login-title" className="flex flex-col gap-5">
        <h2 id="login-title" className="font-heading text-[33px] leading-[1.12] font-normal tracking-[-0.02em]">
          {t.auth.login.title}
        </h2>
        <AuthTabs active="login" />

        <Field label={t.auth.login.login}>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder={t.auth.login.loginPlaceholder}
            autoComplete="username"
            required
            className={inputClass}
          />
        </Field>

        <Field label={t.auth.login.password}>
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t.auth.login.passwordPlaceholder}
            autoComplete="current-password"
            required
          />
        </Field>
        <Link href="/forgot-password" className="-mt-2.5 self-end text-sm text-primary underline transition-colors hover:text-foreground">
          {t.auth.login.forgot}
        </Link>

        <FormError error={error} />
        <SubmitButton loading={loading}>{t.auth.login.submit}</SubmitButton>
        <GuestLink />
      </form>
    </FormMotion>
  );
}
