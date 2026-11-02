"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import type { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// Поле ввода как на холсте: высокое, тёмное, с тонкой рамкой
export const inputClass =
  "box-border h-14 w-full rounded-xl border border-[rgb(90_62_40/0.18)] bg-[rgb(90_62_40/0.05)] px-[18px] font-sans text-base tracking-normal text-foreground normal-case outline-none transition-colors placeholder:text-dim focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary";

export const goldButtonClass =
  "lx-gold flex h-[60px] cursor-pointer items-center justify-center gap-3 rounded-xl border-0 bg-primary text-sm font-bold text-primary-foreground disabled:cursor-default disabled:opacity-70";

// Подпись сверху моноширинным шрифтом, поле внутри <label>
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[13px] font-semibold text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export function PasswordInput(props: React.ComponentProps<"input">) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={visible ? "text" : "password"} className={cn(inputClass, "pr-14")} />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
        className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center text-muted-foreground transition-colors hover:text-primary"
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </span>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={loading} className={goldButtonClass}>
      {loading ? <LoaderCircle className="size-5 animate-spin" /> : children}
    </button>
  );
}

// Ошибка от API: общий текст и, если есть, ошибки по полям
export function FormError({ error }: { error: ApiError | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-1 text-sm text-[#b5532a]">
          <p>{error.message}</p>
          {error.errors.map((message) => (
            <p key={message} className="text-[13px]">
              · {message}
            </p>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Переключатель «Вход / Регистрация» — две страницы, медная подложка у текущей
export function AuthTabs({ active }: { active: "login" | "register" }) {
  const t = useT();
  const tabs = [
    { key: "login", href: "/login", label: t.auth.tabLogin },
    { key: "register", href: "/register", label: t.auth.tabSignup },
  ];
  return (
    <div role="group" aria-label={`${t.auth.tabLogin} / ${t.auth.tabSignup}`} className="relative flex gap-1.5 rounded-xl bg-[rgb(90_62_40/0.06)] p-[5px]">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={cn(
            "relative flex h-[46px] flex-1 items-center justify-center rounded-xl text-sm font-semibold transition-colors",
            tab.key === active ? "text-primary-foreground" : "text-soft hover:text-foreground",
          )}
        >
          {tab.key === active && (
            <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-primary" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
          )}
          <span className="relative">{tab.label}</span>
        </Link>
      ))}
    </div>
  );
}

// «или» + «Продолжить без входа»
export function GuestLink() {
  const t = useT();
  return (
    <>
      <div className="flex items-center gap-3.5 text-xs text-dim">
        <span className="h-px flex-1 bg-[rgb(90_62_40/0.1)]" />
        {t.auth.or}
        <span className="h-px flex-1 bg-[rgb(90_62_40/0.1)]" />
      </div>
      <Link
        href="/"
        className="flex h-14 items-center justify-center rounded-xl border border-[rgb(90_62_40/0.25)] text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/8 hover:text-primary"
      >
        {t.auth.noLogin}
      </Link>
    </>
  );
}

// Надёжность пароля: 4 деления — длина, длина 10+, буквы и цифры, знаки или заглавные
export function PasswordStrength({ password }: { password: string }) {
  const t = useT();
  const score =
    (password.length >= 6 ? 1 : 0) +
    (password.length >= 10 ? 1 : 0) +
    (/[0-9]/.test(password) && /[a-zа-я]/i.test(password) ? 1 : 0) +
    (/[^0-9a-zа-я]/i.test(password) || /[A-ZА-Я]/.test(password) ? 1 : 0);
  const color = score <= 1 ? "#E07A5F" : score === 2 ? "#E8C35C" : "#6FCF97";
  const text = !password ? t.auth.strength.empty : score <= 1 ? t.auth.strength.weak : score === 2 ? t.auth.strength.medium : t.auth.strength.strong;

  return (
    <div className="-mt-2 flex flex-col gap-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className="h-1 flex-1 transition-colors duration-300" style={{ backgroundColor: index < score ? color : "rgb(160 122 82 / 0.18)" }} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}

// Появление формы при открытии страницы
export function FormMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="w-full max-w-[440px]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
