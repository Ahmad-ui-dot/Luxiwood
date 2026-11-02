"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; disabled?: boolean };

// Выпадающий список вместо системного <select>: одинаково выглядит во всех браузерах.
// className — оформление кнопки, чтобы список совпадал с полями ввода рядом
function Select({
  value,
  onValueChange,
  options,
  placeholder,
  required,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <SelectPrimitive.Root
      items={options}
      value={selected ? value : null}
      onValueChange={(next) => onValueChange(next ?? "")}
      required={required}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-default disabled:opacity-50 data-popup-open:border-primary",
          className,
        )}
      >
        <SelectPrimitive.Value className="truncate data-placeholder:text-dim" placeholder={placeholder} />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground transition-transform data-popup-open:rotate-180">
          <ChevronDownIcon className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner alignItemWithTrigger={false} sideOffset={6} className="z-50 outline-none">
          <SelectPrimitive.Popup className="max-h-[min(320px,var(--available-height))] min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-foreground outline-none select-none data-disabled:cursor-default data-disabled:opacity-50 data-highlighted:bg-muted data-selected:font-medium data-selected:text-primary"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator>
                    <CheckIcon className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

export { Select };
