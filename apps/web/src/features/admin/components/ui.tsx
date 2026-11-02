"use client";

import { type OrderStatus } from "@luxiwood/shared";
import { ArrowLeft, ChevronLeft, ChevronRight, Inbox, LoaderCircle, type LucideIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// Общие классы: поле ввода/выбора, таблица
export const fieldClass =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors placeholder:text-dim focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20";
export const tableClass = "w-full min-w-[720px] border-collapse text-sm";
export const thClass = "border-b border-border bg-muted/50 px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground first:rounded-tl-lg last:rounded-tr-lg";
export const tdClass = "border-b border-border px-3 py-3 align-middle";
export const actionsTdClass = "border-b border-border px-3 py-2 text-right whitespace-nowrap";

export function PageTitle({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-[clamp(26px,3vw,36px)] leading-tight tracking-[-0.01em]">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// Белая карточка-раздел. icon — значок у заголовка, action — кнопка или подпись справа от заголовка
export function Panel({
  title,
  icon: Icon,
  action,
  className,
  children,
}: {
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-5", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="flex items-center gap-2.5 text-base font-semibold">
              {Icon && (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
              )}
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// «← Заказы» над заголовком страницы
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 self-start rounded-lg py-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}

// Поле ввода с подписью единицы внутри справа: «сомони», «см», «дн.»
export function SuffixInput({ suffix, className, ...props }: React.ComponentProps<"input"> & { suffix: string }) {
  return (
    <span className="relative block">
      <input {...props} className={cn(fieldClass, "pr-20 tabular-nums", className)} />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-dim">{suffix}</span>
    </span>
  );
}

// Кружок с первой буквой имени
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary uppercase", className)}>
      {name.trim()[0] ?? "?"}
    </span>
  );
}

// Переключатель вкл/выкл вместо галочки
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-3 text-sm", disabled && "cursor-default opacity-60")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none disabled:cursor-default",
          checked ? "bg-primary" : "bg-input",
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform", checked && "translate-x-5")} />
      </button>
      {label}
    </label>
  );
}

export function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5 text-[13px] font-medium text-muted-foreground", className)}>
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-dim">{hint}</span>}
    </label>
  );
}

// Пока данных нет — крутилка или текст ошибки
export function Loading({ error }: { error: string | null }) {
  const t = useT();
  if (error) return <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>;
  return (
    <div className="flex items-center gap-2.5 py-16 text-sm text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin text-primary" />
      {t.admin.loading}
    </div>
  );
}

export function Empty() {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-5" />
      </span>
      {t.admin.empty}
    </div>
  );
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: "bg-primary/12 text-primary",
  FRAME: "bg-amber-500/15 text-amber-800",
  ASSEMBLY: "bg-amber-500/15 text-amber-800",
  UPHOLSTERY: "bg-amber-500/15 text-amber-800",
  DELIVERING: "bg-sky-500/15 text-sky-800",
  DONE: "bg-emerald-500/15 text-emerald-800",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const t = useT();
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_COLORS[status])}>{t.labels.status[status]}</span>;
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  const t = useT();
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft />
        {t.admin.prev}
      </Button>
      <span>{t.admin.pageOf(page, pages)}</span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        {t.admin.next}
        <ChevronRight />
      </Button>
    </div>
  );
}

// Маленькая кнопка-иконка для действий в строке таблицы. label — подсказка при наведении и текст для экранного диктора
export function IconButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={cn("text-muted-foreground", className)}>
      {children}
    </Button>
  );
}

// Удаление с подтверждением в окне. icon — вместо кнопки с текстом маленькая корзина
export function ConfirmButton({
  onConfirm,
  disabled,
  description,
  icon,
  children,
}: {
  onConfirm: () => void;
  disabled?: boolean;
  description?: string;
  icon?: boolean;
  children: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      {icon ? (
        <IconButton label={children} disabled={disabled} onClick={() => setOpen(true)} className="hover:bg-destructive/10 hover:text-destructive">
          <Trash2 />
        </IconButton>
      ) : (
        <Button variant="destructive" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
          {children}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>{t.admin.sure}</DialogTitle>
          <DialogDescription>{description ?? t.admin.cantUndo}</DialogDescription>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="lg" onClick={() => setOpen(false)}>
              {t.admin.cancel}
            </Button>
            <Button
              size="lg"
              className="bg-destructive text-white hover:bg-destructive/85"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              <Trash2 />
              {t.admin.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Окно с формой добавления / изменения. «Сохранить» отправляет форму, поэтому работают required и Enter
export function FormDialog({
  open,
  onOpenChange,
  title,
  busy,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  busy?: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="flex flex-col gap-4"
        >
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              {t.admin.cancel}
            </Button>
            <Button type="submit" size="lg" disabled={busy}>
              {busy && <LoaderCircle className="animate-spin" />}
              {t.admin.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Кнопки-фильтры: «Все», «Принят», «Каркас»… withAll={false} — без кнопки «Все»
export function FilterTabs<T extends string>({
  value,
  options,
  onChange,
  withAll = true,
}: {
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (value: T | "") => void;
  withAll?: boolean;
}) {
  const t = useT();
  const all = withAll ? [{ value: "" as const, label: t.admin.all }, ...options] : options;
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 cursor-pointer rounded-full border px-3 text-[13px] transition-colors",
            value === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-soft hover:border-primary/50",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
