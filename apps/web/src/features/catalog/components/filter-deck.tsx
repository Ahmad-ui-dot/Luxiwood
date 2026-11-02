"use client";

import { type ProductListItem } from "@luxiwood/shared";
import { cn } from "@/lib/utils";
import { furnitureTitle } from "@/lib/format";
import { type CatalogFilters, FIT_ANY, FIT_MIN, type Flag, groupDigits, priceBounds, type ProductFilters, toggle } from "../catalog-filters";
import { useT } from "@/lib/i18n";

type Props = {
  state: CatalogFilters;
  update: (patch: Partial<CatalogFilters>) => void;
  products: ProductListItem[];
  filters: ProductFilters;
  typeImages: Record<string, string>;
};

const panelClass = "bp-frame relative flex min-w-0 flex-col gap-4 border border-blueprint/22 bg-[rgb(255_250_243/0.7)] px-5 pt-5 pb-[18px]";
const tokenClass = "h-9 cursor-pointer border px-3 text-[13px] whitespace-nowrap transition-colors";
const BINS = 12;

function Label({ number, children, className }: { number: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2.5 text-[13px] font-medium text-blueprint ", className)}>
      <b className="font-medium text-primary">{number}</b>
      {children}
    </p>
  );
}

function tokenState(pressed: boolean) {
  return pressed ? "border-primary bg-primary/12 text-foreground" : "border-blueprint/30 text-soft hover:border-blueprint hover:text-foreground";
}

// Шкала с отметками каждые 10 и 50 см — как линейка на чертеже
const rulerStyle: React.CSSProperties = {
  background:
    "repeating-linear-gradient(90deg, rgb(160 122 82 / .55) 0 1px, transparent 1px 4.1666%), repeating-linear-gradient(90deg, rgb(160 122 82 / .9) 0 1px, transparent 1px 20.8333%)",
  backgroundSize: "100% 7px, 100% 14px",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "bottom",
};

export function FilterDeck({ state, update, products, filters, typeImages }: Props) {
  const t = useT();
  const [floor, ceil] = priceBounds(filters);
  const colors = filters.colors.filter((color) => color.count > 0);
  const selectedColor = colors.find((color) => color.id === state.colorId);

  // Точки на шкале ширины: модели одной ширины встают столбиком, не выше 5 точек — чтобы не залезать на подпись
  const stack: Record<number, number> = {};
  const dots = products.map((product) => {
    const width = Math.min(Math.max(product.widthCm, FIT_MIN), FIT_ANY);
    const bucket = Math.round(width / 10);
    stack[bucket] = (stack[bucket] ?? 0) + 1;
    return { id: product.id, name: furnitureTitle(product.name), x: ((width - FIT_MIN) / (FIT_ANY - FIT_MIN)) * 100, y: Math.min(stack[bucket] - 1, 4) * 9, fits: state.fit >= FIT_ANY || product.widthCm <= state.fit };
  });
  const fitPercent = ((state.fit - FIT_MIN) / (FIT_ANY - FIT_MIN)) * 100;

  // Гистограмма цен: сколько моделей в каждом из 12 отрезков
  const binSize = (ceil - floor) / BINS || 1;
  const bins = Array.from({ length: BINS }, (_, index) => {
    const from = floor + index * binSize;
    const count = products.filter((product) => product.basePrice >= from && (product.basePrice < from + binSize || (index === BINS - 1 && product.basePrice <= ceil))).length;
    return { count, active: from + binSize > state.price[0] && from < state.price[1] };
  });
  const maxBin = Math.max(...bins.map((bin) => bin.count), 1);

  const flags: { value: Flag; label: string }[] = [
    { value: "sale", label: t.catalog.flagSale },
    { value: "HIT", label: t.catalog.flagHit },
    { value: "NEW", label: t.catalog.flagNew },
  ];

  return (
    <div className="grid gap-3.5 lg:grid-cols-2">
      {/* 01 · Тип мебели — на всю ширину: типов много */}
      <div className={cn(panelClass, "lg:col-span-2")}>
        <Label number="01">{t.catalog.type}</Label>
        <div role="group" aria-label={t.catalog.type} className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-11">
          {filters.types.map((type) => {
            const pressed = state.types.includes(type.value);
            return (
              <button
                key={type.value}
                type="button"
                aria-pressed={pressed}
                onClick={() => update({ types: toggle(state.types, type.value) })}
                className={cn(
                  "group/type flex min-w-0 cursor-pointer flex-col gap-1.5 border p-2 pb-2.5 text-left transition-[border-color,background,transform] duration-300 hover:-translate-y-[3px] hover:border-blueprint",
                  pressed ? "border-primary bg-primary/10" : "border-blueprint/20 bg-transparent",
                )}
              >
                <span className="relative block aspect-square">
                  {typeImages[`type:${type.value}`] && (
                    <img
                      src={typeImages[`type:${type.value}`]}
                      alt=""
                      className={cn(
                        "absolute inset-[8%] size-[84%] object-contain transition-[opacity,filter] duration-450",
                        !pressed && "opacity-55 grayscale-[.6] group-hover/type:opacity-100 group-hover/type:grayscale-0",
                      )}
                    />
                  )}
                </span>
                <span className="flex items-baseline justify-between gap-1.5 text-[13px]">
                  <span className="truncate">{t.labels.model[type.value]}</span>
                  <span className={pressed ? "text-primary" : "text-dim"}>{type.count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 02 · Цвет и дерево — веер образцов */}
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <Label number="02">{t.catalog.fabric}</Label>
          <span className="text-[13px] text-foreground">{selectedColor?.name ?? t.catalog.anyColor}</span>
        </div>
        <div role="group" aria-label={t.catalog.fabric} className="group/book flex min-h-[110px] flex-wrap items-end gap-y-[22px] pt-[26px] pr-1.5 pb-1 pl-3">
          {colors.map((color, index) => {
            const pressed = color.id === state.colorId;
            return (
              <button
                key={color.id}
                type="button"
                aria-pressed={pressed}
                aria-label={`${color.name} · ${color.count}`}
                title={color.name}
                onClick={() => update({ colorId: pressed ? null : color.id })}
                style={{ background: color.hex, "--rot": `${((index % 5) - 2) * 3}deg` } as React.CSSProperties}
                className={cn(
                  "relative -mr-3 h-[92px] w-[58px] cursor-pointer border-0 p-0 shadow-[0_8px_16px_rgb(0_0_0/0.35)] transition-[transform,margin,box-shadow] duration-350 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/book:mr-0.5",
                  pressed
                    ? "z-[2] [transform:translateY(-16px)] shadow-[0_0_0_2px_#c0612f,0_14px_24px_rgb(0_0_0/0.45)]"
                    : "[transform:rotate(var(--rot))] hover:z-[3] hover:[transform:translateY(-12px)]",
                )}
              >
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[18px] bg-[rgb(255_250_243/0.72)] text-[9px] leading-[18px] text-foreground">
                  {color.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 03 · Впишется в нишу */}
      <div className={panelClass}>
        <div className="flex items-end justify-between gap-3">
          <Label number="03">{t.catalog.fit}</Label>
          <span className="font-heading text-xl tracking-[-0.02em]">
            {state.fit >= FIT_ANY ? t.catalog.fitAny : `${t.catalog.fitUpTo}${state.fit} ${t.catalog.cm}`}
          </span>
        </div>
        <div className="relative h-28">
          <div aria-hidden="true" className="absolute inset-x-[9px] top-1.5 h-[46px]">
            {dots.map((dot) => (
              <span
                key={dot.id}
                title={dot.name}
                className={cn("absolute -ml-[3px] size-[7px] transition-colors duration-300", dot.fits ? "bg-primary" : "bg-blueprint/30")}
                style={{ left: `${dot.x}%`, bottom: dot.y }}
              />
            ))}
            <span className="absolute -bottom-2 left-0 h-2.5 border border-t-0 border-primary transition-[width] duration-200" style={{ width: `${fitPercent}%` }} />
          </div>
          <div aria-hidden="true" className="absolute inset-x-[9px] top-[62px] h-3.5" style={rulerStyle} />
          <div aria-hidden="true" className="absolute inset-x-[9px] top-[82px] flex justify-between text-xs text-dim">
            {["60", "110", "160", "210", "260", "300+"].map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </div>
          <input
            type="range"
            aria-label={t.catalog.fit}
            min={FIT_MIN}
            max={FIT_ANY}
            step={10}
            value={state.fit}
            onChange={(event) => update({ fit: Number(event.target.value) })}
            className="ct-range top-12"
          />
        </div>
        <p className="text-[13px] leading-normal text-muted-foreground">
          {t.catalog.fitHint} <span className="text-dim">{t.catalog.fitDots}</span>
        </p>
      </div>

      {/* 04 · Бюджет */}
      <div className={panelClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Label number="04">{t.catalog.budget}</Label>
          <span className="font-heading text-xl tracking-[-0.02em]">
            {groupDigits(state.price[0])} – {groupDigits(state.price[1])} {t.common.somShort}
          </span>
        </div>
        <div className="relative h-28">
          <div aria-hidden="true" className="absolute inset-x-[9px] top-0 flex h-[62px] items-end gap-[3px] border-b border-blueprint/60">
            {bins.map((bin, index) => (
              <span
                key={index}
                className={cn("flex-1 transition-[height,background] duration-500", bin.active ? "bg-primary" : "bg-blueprint/25")}
                style={{ height: bin.count ? `${(bin.count / maxBin) * 100}%` : 2 }}
              />
            ))}
          </div>
          <input
            type="range"
            aria-label={`${t.catalog.budget}: ${t.common.rangeFrom}`}
            min={floor}
            max={ceil}
            step={100}
            value={state.price[0]}
            onChange={(event) => update({ price: [Math.min(Number(event.target.value), state.price[1]), state.price[1]] })}
            className="ct-range top-12"
          />
          <input
            type="range"
            aria-label={`${t.catalog.budget}: ${t.common.rangeTo}`}
            min={floor}
            max={ceil}
            step={100}
            value={state.price[1]}
            onChange={(event) => update({ price: [state.price[0], Math.max(Number(event.target.value), state.price[0])] })}
            className="ct-range top-12"
          />
          <div aria-hidden="true" className="absolute inset-x-[9px] top-[82px] flex justify-between text-xs text-dim">
            <span>{groupDigits(floor)}</span>
            <span>{groupDigits(ceil)}</span>
          </div>
        </div>
        <p className="text-[13px] leading-normal text-muted-foreground">{t.catalog.budgetHint}</p>
      </div>

      {/* 05–07 · Комната, срок, подборки */}
      <div className={cn(panelClass, "flex-row flex-wrap items-start gap-x-[34px] gap-y-[22px]")}>
        <div className="flex min-w-0 flex-[1_1_100%] flex-col gap-3">
          <Label number="05">{t.catalog.room}</Label>
          <div role="group" aria-label={t.catalog.room} className="flex flex-wrap gap-2">
            {filters.rooms
              .filter((room) => room.count > 0)
              .map((room) => {
                const pressed = state.rooms.includes(room.value);
                return (
                  <button
                    key={room.value}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => update({ rooms: toggle(state.rooms, room.value) })}
                    className={cn(tokenClass, tokenState(pressed))}
                  >
                    {pressed ? "■" : "□"} {room.label} <span className="text-dim">{room.count}</span>
                  </button>
                );
              })}
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
          <Label number="06">{t.catalog.days}</Label>
          <div role="group" aria-label={t.catalog.days} className="flex self-start border border-blueprint/30">
            {t.catalog.daysOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={state.maxDays === option.value}
                onClick={() => update({ maxDays: option.value })}
                className={cn(
                  "h-9 cursor-pointer px-3.5 text-[13px] whitespace-nowrap transition-colors",
                  state.maxDays === option.value ? "bg-primary text-primary-foreground" : "text-soft hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3">
          <Label number="07">{t.catalog.flags}</Label>
          <div role="group" aria-label={t.catalog.flags} className="flex flex-wrap gap-2">
            {flags.map((flag) => {
              const pressed = state.flags.includes(flag.value);
              return (
                <button
                  key={flag.value}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => update({ flags: toggle(state.flags, flag.value) })}
                  className={cn(tokenClass, tokenState(pressed))}
                >
                  {pressed ? "■" : "□"} {flag.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
