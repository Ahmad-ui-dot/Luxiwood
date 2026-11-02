"use client";

import type { AuthToken } from "@luxiwood/shared";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Field, FormError, FormMotion, inputClass, PasswordInput, PasswordStrength, SubmitButton } from "./form-parts";
import { LoggedInPanel } from "./logged-in-panel";
import { useT } from "@/lib/i18n";

const slide = { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 } };

// Три шага: почта → код из письма → новый пароль. Код и пароль уходят в API вместе на последнем шаге
export function ForgotPasswordForm() {
  const t = useT();
  const { user, ready, signIn } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email: email.trim() } });
      setCode("");
      setStep(2);
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setLoading(false);
    }
  }

  function confirmCode(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== 6) {
      setError(new ApiError({ statusCode: 400, message: t.auth.forgot.codeLength }));
      return;
    }
    setError(null);
    setStep(3);
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
      const data = await api<AuthToken>("/auth/reset-password", { method: "POST", body: { email: email.trim(), code, newPassword: password } });
      signIn(data);
      toast.success(t.auth.forgot.success);
    } catch (caught) {
      const apiError = toApiError(caught);
      setError(apiError);
      // Неверный или устаревший код — возвращаемся к вводу кода
      if (apiError.status === 400 && apiError.errors.length === 0) {
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  }

  if (ready && user) {
    return <LoggedInPanel />;
  }

  return (
    <FormMotion>
      <div className="flex flex-col gap-[18px]">
        <Link href="/login" className="self-start text-sm text-muted-foreground transition-colors hover:text-foreground">
          {t.auth.forgot.back}
        </Link>
        <h2 className="font-heading text-[30px] leading-[1.12] font-normal tracking-[-0.02em]">{t.auth.forgot.title}</h2>

        <div role="list" aria-label={t.common.steps} className="grid grid-cols-3 gap-1">
          {t.auth.forgot.steps.map((label, index) => (
            <div key={label} role="listitem" className="flex flex-col gap-1.5">
              <span className={cn("h-[3px] transition-colors duration-300", index < step ? "bg-primary" : "bg-blueprint/20")} />
              <span className={cn(" text-xs ", index < step ? "text-foreground" : "text-dim")}>{label}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form key="email" {...slide} onSubmit={sendCode} className="flex flex-col gap-[18px]">
              <p className="text-[15px] leading-[1.6] text-soft">{t.auth.forgot.emailText}</p>
              <Field label={t.auth.forgot.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@gmail.com"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </Field>
              <FormError error={error} />
              <SubmitButton loading={loading}>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6.5V18a1.5 1.5 0 0 0 1.5 1.5H7V10.2l5 3.8 5-3.8v9.3h2.5A1.5 1.5 0 0 0 21 18V6.5L12 13z" fill="currentColor" />
                </svg>
                {t.auth.forgot.sendCode}
              </SubmitButton>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form key="code" {...slide} onSubmit={confirmCode} className="flex flex-col gap-[18px]">
              <div className="flex gap-3 border border-blueprint/30 bg-blueprint/6 p-3.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a07a52" strokeWidth="1.6" aria-hidden="true" className="shrink-0">
                  <rect x="3" y="5" width="18" height="14" rx="1" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <div className="flex flex-col gap-1 text-sm leading-[1.5]">
                  <b>
                    {t.auth.forgot.sentTitle}
                    {email}
                  </b>
                  <span className="text-soft">{t.auth.forgot.sentText}</span>
                </div>
              </div>
              <Field label={t.auth.forgot.code}>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="______"
                  required
                  className={cn(inputClass, " text-xl tracking-[0.5em]")}
                />
              </Field>
              <FormError error={error} />
              <SubmitButton loading={false}>{t.auth.forgot.confirmCode}</SubmitButton>
              <button
                type="button"
                disabled={loading}
                onClick={() => sendCode()}
                className="cursor-pointer self-center text-sm text-muted-foreground underline transition-colors hover:text-foreground"
              >
                {t.auth.forgot.resend}
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form key="password" {...slide} onSubmit={savePassword} className="flex flex-col gap-[18px]">
              <p className="text-[15px] text-soft">{t.auth.forgot.newText}</p>
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
              <SubmitButton loading={loading}>{t.auth.forgot.save}</SubmitButton>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </FormMotion>
  );
}
