"use client";

import { calcConfiguratorPrice, type ConfiguratorKey, type ConfiguratorPrices, type ConfiguratorQuote, type ConfiguratorTypeOptions, type Material, type SizeRange } from "@luxiwood/shared";
import { LoaderCircle, RotateCcw, RotateCw } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Swatches } from "@/features/product/components/product-view";
import type { ViewControls } from "@/features/viewer3d/product-scene";
import { api, toApiError } from "@/lib/api";
import { MAX_CART_ITEMS, useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const ProductScene = dynamic(() => import("@/features/viewer3d/product-scene"), { ssr: false });

const labelClass = "text-[13px] font-semibold text-muted-foreground";
const toolClass =
  "flex size-11 cursor-pointer items-center justify-center border border-blueprint/30 bg-[rgb(255_250_243/0.9)] text-foreground transition-colors hover:border-primary hover:text-primary";

// Выбор покупателя — те же поля, что уходят в /configurator/quote и в заказ
type Choice = {
  widthCm: number;
  depthCm: number;
  heightCm: number;
  upholsteryMaterialId?: number;
  colorMaterialId?: number;
  woodMaterialId: number;
  finishMaterialId: number;
  options: string[];
};

// Размер по умолчанию и первые материалы. Цвет обивки по желанию — без него модель в цвете ткани
function defaultChoice(config: ConfiguratorTypeOptions): Choice {
  return {
    widthCm: config.widthCm.default,
    depthCm: config.depthCm.default,
    heightCm: config.heightCm.default,
    upholsteryMaterialId: config.fabrics[0]?.id,
    colorMaterialId: undefined,
    woodMaterialId: config.woods[0]?.id,
    finishMaterialId: config.finishes[0]?.id,
    options: [],
  };
}

function findMaterial(list: Material[], id?: number) {
  return list.find((material) => material.id === id);
}

function SizeSlider({ label, range, value, onChange }: { label: string; range: SizeRange; value: number; onChange: (value: number) => void }) {
  const t = useT();
  const percent = ((value - range.min) / (range.max - range.min)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className={labelClass}>{label}</span>
        <span className="text-sm tabular-nums">
          {value} {t.catalog.cm}
        </span>
      </div>
      <div className="relative h-7">
        <div aria-hidden="true" className="absolute inset-x-[9px] top-[13px] h-px bg-blueprint/40" />
        <div aria-hidden="true" className="absolute inset-x-[9px] top-[12px] h-[3px]">
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <input
          type="range"
          aria-label={label}
          min={range.min}
          max={range.max}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="ct-range top-0"
        />
      </div>
      <div aria-hidden="true" className="flex justify-between text-xs text-dim">
        <span>{range.min}</span>
        <span>{range.max}</span>
      </div>
    </div>
  );
}

export function ConfiguratorView({ types }: { types: ConfiguratorTypeOptions[] }) {
  const t = useT();
  const router = useRouter();
  const cart = useCart();
  const searchParams = useSearchParams();
  const controls = useRef<ViewControls>({ yaw: -0.65, zoom: 1 });

  // ?type=wardrobe — со страницы товара «Собрать под свой размер»
  const [type, setType] = useState<ConfiguratorKey>(() => types.find((item) => item.type === searchParams.get("type"))?.type ?? types[0].type);
  const config = types.find((item) => item.type === type)!;
  const [choice, setChoice] = useState<Choice>(() => defaultChoice(config));
  const [adding, setAdding] = useState(false);
  const pick = (patch: Partial<Choice>) => setChoice((current) => ({ ...current, ...patch }));

  function selectType(next: ConfiguratorTypeOptions) {
    setType(next.type);
    setChoice(defaultChoice(next));
  }

  function toggleOption(key: string) {
    pick({ options: choice.options.includes(key) ? choice.options.filter((item) => item !== key) : [...choice.options, key] });
  }

  // Цены из настроек мастерской — в том виде, который ждёт формула из shared
  const prices = useMemo<ConfiguratorPrices>(
    () => ({
      basePrices: Object.fromEntries(types.map((item) => [item.type, item.basePrice])) as Record<ConfiguratorKey, number>,
      optionPrices: Object.fromEntries(types.flatMap((item) => item.options.map((option) => [option.key, option.price]))),
    }),
    [types],
  );

  const upholstery = findMaterial(config.fabrics, choice.upholsteryMaterialId);
  const color = findMaterial(config.colors, choice.colorMaterialId);
  const wood = findMaterial(config.woods, choice.woodMaterialId);
  const finish = findMaterial(config.finishes, choice.finishMaterialId);

  // Та же формула, что на сервере — цена и срок меняются сразу
  const result = calcConfiguratorPrice(
    {
      type,
      widthCm: choice.widthCm,
      depthCm: choice.depthCm,
      heightCm: choice.heightCm,
      upholstery,
      color,
      wood: wood!,
      finish: finish!,
      options: choice.options,
    },
    prices,
  );

  // Мягкая мебель — в цвете обивки (или ткани), корпусная — в цвете дерева
  const mainHex = (config.usesUpholstery ? (color ?? upholstery) : wood)?.hex ?? "#8E7F72";
  const colors = useMemo(() => ({ main: mainHex, wood: wood?.hex }), [mainHex, wood?.hex]);
  const scale = useMemo<[number, number, number]>(
    () => [choice.widthCm / config.widthCm.default, choice.heightCm / config.heightCm.default, choice.depthCm / config.depthCm.default],
    [choice.widthCm, choice.heightCm, choice.depthCm, config],
  );

  // Цену для корзины уточняем у API: в заказе сервер посчитает так же
  async function addToCart(goToCart: boolean) {
    if (cart.items.length >= MAX_CART_ITEMS) {
      toast.error(t.cart.full);
      return;
    }
    setAdding(true);
    try {
      const quote = await api<ConfiguratorQuote>("/configurator/quote", { method: "POST", body: { type, ...choice, quantity: 1 } });
      const title = t.configurator.itemTitle(t.labels.model[config.type]);
      cart.add({
        key: [type, choice.widthCm, choice.depthCm, choice.heightCm, choice.upholsteryMaterialId, choice.colorMaterialId, choice.woodMaterialId, choice.finishMaterialId, ...[...choice.options].sort()].join("-"),
        type,
        ...choice,
        quantity: 1,
        title,
        model3dKey: type,
        colorName: [color?.name ?? upholstery?.name, wood?.name, finish?.name].filter(Boolean).join(", "),
        colorHex: mainHex,
        sizeLabel: `${choice.widthCm}×${choice.depthCm}×${choice.heightCm} ${t.catalog.cm}`,
        preview: colors,
        unitPrice: quote.price,
      });
      if (goToCart) {
        router.push("/cart");
      } else {
        toast.success(t.cart.added, { description: title, action: { label: t.cart.open, onClick: () => router.push("/cart") } });
      }
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="px-[max(20px,4vw)] pt-7 pb-[110px]">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-[26px]">
        <nav aria-label={t.common.breadcrumbs} className="flex flex-wrap gap-2.5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            {t.nav.home}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{t.configurator.title}</span>
        </nav>

        <div className="flex flex-col gap-3.5">
          <p className="text-xs font-semibold text-primary">{t.configurator.kicker}</p>
          <h1 className="font-heading text-[clamp(32px,3.6vw,52px)] leading-[1.05] font-normal tracking-[-0.03em]">{t.configurator.title}</h1>
          <p className="max-w-[640px] text-[17px] leading-[1.6] font-light text-soft">{t.configurator.text}</p>
        </div>

        <div className="flex flex-wrap items-start gap-14">
          {/* 3D-превью с размерными линиями: модель растёт вместе с ползунками */}
          <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-4 lg:sticky lg:top-24">
            <div className="bp-frame bp-paper relative h-[clamp(380px,60vw,640px)] overflow-hidden rounded-xl border border-blueprint/30 bg-[#f1e9dd]">
              <div className="bp-dim top-[76px] right-[16%] left-[16%] z-[2]">
                <i />
                <span>
                  {choice.widthCm} {t.catalog.cm}
                </span>
                <i />
              </div>
              <div className="bp-vdim top-[24%] right-[26px] bottom-[30%] z-[2]">
                <i />
                <span>
                  {choice.heightCm} {t.catalog.cm}
                </span>
                <i />
              </div>
              <p className="absolute top-6 left-6 z-[2] text-[13px] text-blueprint">
                {t.labels.model[config.type]} · {choice.depthCm} {t.catalog.cm} {t.configurator.depth.toLowerCase()}
              </p>
              <div className="absolute inset-0">
                <ProductScene type={type} colors={colors} scale={scale} controls={controls} />
              </div>
              <p className="pointer-events-none absolute bottom-6 left-6 z-[2] flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <span className="rounded-xl border border-primary/60 px-2.5 py-1 text-[13px] font-bold text-primary">3D</span>
                <span className="hidden sm:inline">{t.product.viewHint}</span>
              </p>
              <div role="toolbar" aria-label={t.product.toolbar} className="absolute right-6 bottom-6 z-[2] flex gap-2">
                <button type="button" aria-label={t.product.turnLeft} onClick={() => (controls.current.yaw += 0.6)} className={toolClass}>
                  <RotateCcw className="size-[18px]" />
                </button>
                <button type="button" aria-label={t.product.turnRight} onClick={() => (controls.current.yaw -= 0.6)} className={toolClass}>
                  <RotateCw className="size-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Выбор: тип, размеры, материалы, опции, расчёт */}
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-[30px]">
            <div className="flex flex-col gap-3.5">
              <p className={labelClass}>{t.configurator.type}</p>
              <div role="group" aria-label={t.configurator.type} className="flex flex-wrap gap-2.5">
                {types.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    aria-pressed={item.type === type}
                    onClick={() => selectType(item)}
                    className={cn(
                      "h-12 cursor-pointer rounded-xl border px-[18px] text-[15px] font-semibold transition-colors",
                      item.type === type
                        ? "border-primary bg-primary/12 text-foreground"
                        : "border-[rgb(90_62_40/0.2)] text-soft hover:border-blueprint hover:text-foreground",
                    )}
                  >
                    {t.labels.model[item.type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-[rgb(90_62_40/0.1)] pt-6">
              <p className={labelClass}>{t.configurator.sizes}</p>
              <SizeSlider label={t.configurator.width} range={config.widthCm} value={choice.widthCm} onChange={(value) => pick({ widthCm: value })} />
              <SizeSlider label={t.configurator.depth} range={config.depthCm} value={choice.depthCm} onChange={(value) => pick({ depthCm: value })} />
              <SizeSlider label={t.configurator.height} range={config.heightCm} value={choice.heightCm} onChange={(value) => pick({ heightCm: value })} />
            </div>

            <div className="flex flex-col gap-6 border-t border-[rgb(90_62_40/0.1)] pt-6">
              <Swatches
                title={t.configurator.fabric}
                list={config.fabrics}
                value={choice.upholsteryMaterialId}
                onPick={(id) => pick({ upholsteryMaterialId: id })}
              />
              <Swatches
                title={t.configurator.color}
                list={config.colors}
                value={choice.colorMaterialId}
                placeholder={t.configurator.colorNone}
                onPick={(id) => pick({ colorMaterialId: id === choice.colorMaterialId ? undefined : id })}
              />
              <Swatches title={t.configurator.wood} list={config.woods} value={choice.woodMaterialId} onPick={(id) => pick({ woodMaterialId: id })} />
              <Swatches title={t.configurator.finish} list={config.finishes} value={choice.finishMaterialId} onPick={(id) => pick({ finishMaterialId: id })} />
            </div>

            {config.options.length > 0 && (
              <div className="flex flex-col gap-3.5 border-t border-[rgb(90_62_40/0.1)] pt-6">
                <p className={labelClass}>{t.configurator.options}</p>
                <div role="group" aria-label={t.configurator.options} className="flex flex-col gap-2">
                  {config.options.map((option) => {
                    const active = choice.options.includes(option.key);
                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleOption(option.key)}
                        className={cn(
                          "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-[15px] transition-colors",
                          active ? "border-primary bg-primary/12 text-foreground" : "border-[rgb(90_62_40/0.2)] text-soft hover:border-blueprint hover:text-foreground",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn("flex size-4 shrink-0 items-center justify-center border", active ? "border-primary bg-primary" : "border-blueprint/60")}
                        />
                        <span className="flex-1 font-semibold">{t.labels.options[option.key] ?? option.label}</span>
                        <span className="text-right text-xs whitespace-nowrap text-muted-foreground">
                          +{t.price(option.price)}
                          {option.days > 0 && ` · ${t.configurator.plusDays(option.days)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Расчёт с расшифровкой — как его покажет сервер */}
            <div className="bp-frame relative flex flex-col gap-4 border border-blueprint/28 bg-[rgb(255_250_243/0.7)] p-5">
              <p className="text-[13px] text-blueprint">
                <b className="font-medium text-primary">◆</b> {t.configurator.priceTitle}
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                {result.breakdown.map((line) => (
                  <li key={line.label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{line.label}</span>
                    <span className="whitespace-nowrap tabular-nums">{t.price(line.amount)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[rgb(90_62_40/0.1)] pt-4">
                <span className="text-[15px] text-muted-foreground">{t.cart.total}</span>
                <span className="font-heading text-[34px] tracking-[-0.02em]">{t.price(result.price)}</span>
              </div>
              <p className="text-sm text-soft">
                {t.configurator.making}: {t.product.makingDays(result.days)}
              </p>
              <p className="text-xs leading-normal text-dim">{result.summary}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={adding}
                onClick={() => addToCart(false)}
                className="lx-gold flex h-[60px] cursor-pointer items-center justify-center gap-3 bg-primary text-sm font-bold text-primary-foreground disabled:cursor-default disabled:opacity-70"
              >
                {adding && <LoaderCircle className="size-4 animate-spin" />}
                {t.product.toCart} · {t.price(result.price)}
              </button>
              <button
                type="button"
                disabled={adding}
                onClick={() => addToCart(true)}
                className="h-[54px] cursor-pointer rounded-xl border border-primary/60 text-[13px] font-bold text-primary transition-colors hover:bg-primary/8 disabled:cursor-default disabled:opacity-70"
              >
                {t.product.oneClick}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
