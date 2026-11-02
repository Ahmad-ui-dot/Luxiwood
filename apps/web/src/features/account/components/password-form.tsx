"use client";

import type { AuthToken } from "@luxiwood/shared";
import { useState } from "react";
import { toast } from "sonner";
import { Field, FormError, inputClass, PasswordInput, PasswordStrength, SubmitButton } from "@/features/auth/components/form-parts";
import { api, ApiError, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { panelClass } from "./profile-form";
import { useT } from "@/lib/i18n";

type Method = "current" | "email";

// Смена пароля двумя способами: по текущему паролю или кодом на почту (тот же сброс, что на /forgot-password)
export function PasswordForm() {
  const t = useT();
  const { user, token, signIn } = useAuth();
  const [method, setMethod] = useState<Method>("current");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }
  const email = user.email;

  function switchMethod(next: Method) {
    setMethod(next);
    setError(null);
  }

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email } });
      setCode("");
      setCodeSent(true);
      toast.success(t.account.codeSent);
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setLoading(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (password !== repeat) {
      setError(new ApiError({ statusCode: 400, message: t.auth.forgot.mismatch }));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // В ответе новый токен: прежние после смены пароля перестают действовать
      const data =
        method === "current"
          ? await api<AuthToken>("/auth/password", { method: "PATCH", body: { currentPassword, newPassword: password }, token })
          : await api<AuthToken>("/auth/reset-password", { method: "POST", body: { email, code, newPassword: password } });
      signIn(data);
      setCodeSent(false);
      setCurrentPassword("");
      setPassword("");
      setRepeat("");
      toast.success(t.account.passwordChanged);
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setLoading(false);
    }
  }

  const newPasswordFields = (
    <>
      <Field label={t.auth.forgot.newPassword}>
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
      <Field label={t.auth.forgot.repeatPassword}>
        <PasswordInput value={repeat} onChange={(event) => setRepeat(event.target.value)} autoComplete="new-password" required minLength={6} />
      </Field>
      <FormError error={error} />
      <SubmitButton loading={loading}>{t.account.changePassword}</SubmitButton>
    </>
  );

  return (
    <form onSubmit={savePassword} aria-labelledby="password-title" className={panelClass}>
      <div className="flex flex-col gap-4">
        <h2 id="password-title" className="font-heading text-xl tracking-[-0.02em]">
          {t.account.passwordTitle}
        </h2>
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["current", "email"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={method === item}
              onClick={() => switchMethod(item)}
              className={cn(
                "h-9 cursor-pointer rounded-lg text-sm font-medium transition-colors",
                method === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item === "current" ? t.account.passwordByCurrent : t.account.passwordByEmail}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {method === "current" ? (
            t.account.passwordCurrentText
          ) : email ? (
            <>
              {t.account.passwordText}
              <b className="font-semibold text-foreground">{email}</b>
            </>
          ) : (
            t.account.passwordNoEmail
          )}
        </p>
      </div>

      {method === "current" && (
        <>
          <Field label={t.account.currentPassword}>
            <PasswordInput value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
          </Field>
          {newPasswordFields}
          {email && (
            <button
              type="button"
              onClick={() => switchMethod("email")}
              className="cursor-pointer self-center text-sm text-muted-foreground underline transition-colors hover:text-foreground"
            >
              {t.account.forgotCurrent}
            </button>
          )}
        </>
      )}

      {method === "email" && email && !codeSent && (
        <>
          <FormError error={error} />
          <button
            type="button"
            disabled={loading}
            onClick={sendCode}
            className="flex h-[60px] cursor-pointer items-center justify-center gap-3 rounded-xl border border-primary/60 text-sm font-bold text-primary transition-colors hover:bg-primary/8 disabled:cursor-default disabled:opacity-70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6.5V18a1.5 1.5 0 0 0 1.5 1.5H7V10.2l5 3.8 5-3.8v9.3h2.5A1.5 1.5 0 0 0 21 18V6.5L12 13z" fill="currentColor" />
            </svg>
            {t.account.sendCode}
          </button>
        </>
      )}

      {method === "email" && email && codeSent && (
        <>
          <div className="flex gap-3 border border-blueprint/30 bg-blueprint/6 p-3.5 text-sm leading-[1.5]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a07a52" strokeWidth="1.6" aria-hidden="true" className="shrink-0">
              <rect x="3" y="5" width="18" height="14" rx="1" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span className="text-soft">{t.auth.forgot.sentText}</span>
          </div>
          <Field label={t.auth.forgot.code}>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={6}
              minLength={6}
              autoComplete="one-time-code"
              placeholder="______"
              required
              className={cn(inputClass, " text-xl tracking-[0.5em]")}
            />
          </Field>
          {newPasswordFields}
          <button
            type="button"
            disabled={loading}
            onClick={sendCode}
            className="cursor-pointer self-center text-sm text-muted-foreground underline transition-colors hover:text-foreground"
          >
            {t.account.otherEmail}
          </button>
        </>
      )}
    </form>
  );
}
