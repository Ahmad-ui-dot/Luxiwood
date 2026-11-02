"use client";

import type { MaterialRole, ProductKind, ProductSize } from "@luxiwood/shared";
import { Box, Image as ImageIcon, ImagePlus, LoaderCircle, Palette, Ruler, Star, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileUrl, toApiError, uploadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { AdminMaterial, AdminProduct } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { fieldClass, Panel } from "./ui";
import { useT } from "@/lib/i18n";

type Props = { product: AdminProduct; onSaved: () => void };
type MaterialLink = { materialId: number; role: MaterialRole; isDefault: boolean };

// Какие роли есть у товара и какой тип материала подходит к роли — те же правила, что на сервере
function rolesFor(kind: ProductKind): MaterialRole[] {
  return kind === "FABRIC" ? ["MAIN", "COLOR", "WOOD"] : ["MAIN"];
}
function typeFor(role: MaterialRole, kind: ProductKind) {
  return role === "MAIN" ? kind : role;
}

export function ProductMaterials({ product, onSaved }: Props) {
  const t = useT();
  const { data: materials } = useAdminQuery<AdminMaterial[]>("/admin/materials");
  const { run, busy } = useAdminAction();
  const [links, setLinks] = useState<MaterialLink[]>([]);
  const roles = rolesFor(product.kind);

  useEffect(() => {
    setLinks(product.materials.map(({ materialId, role, isDefault }) => ({ materialId, role, isDefault })));
  }, [product]);

  function toggle(role: MaterialRole, materialId: number) {
    const current = links.find((link) => link.role === role && link.materialId === materialId);
    if (current) {
      setLinks(links.filter((link) => link !== current));
    } else {
      // Первый отмеченный материал в роли сразу становится «по умолчанию»
      setLinks([...links, { materialId, role, isDefault: !links.some((link) => link.role === role) }]);
    }
  }

  function makeDefault(role: MaterialRole, materialId: number) {
    setLinks(links.map((link) => (link.role === role ? { ...link, isDefault: link.materialId === materialId } : link)));
  }

  async function save() {
    // Роли, которых у товара больше нет (например, сменили ткань на дерево), не отправляем
    const body = { materials: links.filter((link) => roles.includes(link.role)) };
    if (await run(`/admin/products/${product.id}/materials`, "PUT", body, t.admin.saved)) onSaved();
  }

  return (
    <Panel title={t.admin.nav.materials} icon={Palette}>
      <p className="text-sm text-muted-foreground">{t.admin.rolesHint}</p>
      {roles.map((role) => (
        <div key={role} className="flex flex-col gap-2.5">
          <h3 className="text-sm font-medium">{t.admin.roles[role]}</h3>
          <div className="flex flex-wrap gap-2">
            {materials
              ?.filter((material) => material.type === typeFor(role, product.kind))
              .map((material) => {
                const link = links.find((item) => item.role === role && item.materialId === material.id);
                return (
                  <span
                    key={material.id}
                    className={cn(
                      "flex items-center rounded-full border text-sm transition-colors",
                      link ? "border-primary bg-primary/8" : "border-border bg-card",
                      !material.isActive && "opacity-50",
                    )}
                  >
                    <button type="button" aria-pressed={Boolean(link)} onClick={() => toggle(role, material.id)} className="flex cursor-pointer items-center gap-2 py-1.5 pr-2 pl-1.5">
                      <span className="size-5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" style={{ background: material.hex }} />
                      {material.name}
                    </button>
                    {link && (
                      <button
                        type="button"
                        aria-label={t.admin.makeDefault}
                        title={t.admin.makeDefault}
                        onClick={() => makeDefault(role, material.id)}
                        className="cursor-pointer pr-2.5 text-primary"
                      >
                        <Star className={cn("size-4", link.isDefault && "fill-primary")} />
                      </button>
                    )}
                  </span>
                );
              })}
          </div>
        </div>
      ))}
      <Button className="self-start" disabled={busy} onClick={save}>
        {t.admin.saveMaterials}
      </Button>
    </Panel>
  );
}

const sizeGrid = "grid grid-cols-[minmax(90px,2fr)_repeat(4,minmax(64px,1fr))_44px_150px] items-center gap-2";

// Строка размера: существующий (size есть) или новый (пустая строка внизу)
function SizeRow({ productId, size, onSaved }: { productId: number; size?: ProductSize; onSaved: () => void }) {
  const t = useT();
  const { run, busy } = useAdminAction();
  const empty = { label: "", widthCm: "", heightCm: "", depthCm: "", priceDelta: "0", isDefault: false };
  const [row, setRow] = useState(
    size
      ? { label: size.label, widthCm: String(size.widthCm), heightCm: String(size.heightCm), depthCm: String(size.depthCm), priceDelta: String(size.priceDelta), isDefault: size.isDefault }
      : empty,
  );
  const set = (patch: Partial<typeof row>) => setRow((current) => ({ ...current, ...patch }));

  async function save() {
    const body = {
      label: row.label.trim(),
      widthCm: Number(row.widthCm),
      heightCm: Number(row.heightCm),
      depthCm: Number(row.depthCm),
      priceDelta: Number(row.priceDelta),
      isDefault: row.isDefault,
    };
    const path = size ? `/admin/products/${productId}/sizes/${size.id}` : `/admin/products/${productId}/sizes`;
    if (await run(path, size ? "PATCH" : "POST", body, t.admin.saved)) {
      if (!size) setRow(empty);
      onSaved();
    }
  }

  async function remove() {
    if (await run(`/admin/products/${productId}/sizes/${size!.id}`, "DELETE", undefined, t.admin.deleted)) onSaved();
  }

  return (
    <div className={sizeGrid}>
      <input aria-label={t.admin.sizeLabel} placeholder={t.admin.sizeLabel} value={row.label} onChange={(event) => set({ label: event.target.value })} className={fieldClass} />
      <input aria-label={t.admin.sizeW} placeholder={t.admin.sizeW} type="number" value={row.widthCm} onChange={(event) => set({ widthCm: event.target.value })} className={fieldClass} />
      <input aria-label={t.admin.sizeH} placeholder={t.admin.sizeH} type="number" value={row.heightCm} onChange={(event) => set({ heightCm: event.target.value })} className={fieldClass} />
      <input aria-label={t.admin.sizeD} placeholder={t.admin.sizeD} type="number" value={row.depthCm} onChange={(event) => set({ depthCm: event.target.value })} className={fieldClass} />
      <input aria-label={t.admin.priceDelta} placeholder={t.admin.priceDelta} type="number" value={row.priceDelta} onChange={(event) => set({ priceDelta: event.target.value })} className={fieldClass} />
      <label className="flex cursor-pointer items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground" title={t.admin.isDefault}>
        <input type="checkbox" checked={row.isDefault} onChange={(event) => set({ isDefault: event.target.checked })} className="size-4 accent-primary" />
        <Star className="size-3.5" />
      </label>
      <span className="flex gap-1">
        <Button size="sm" variant={size ? "outline" : "default"} disabled={busy} onClick={save}>
          {size ? t.admin.save : t.admin.add}
        </Button>
        {size && (
          <Button size="icon-sm" variant="ghost" aria-label={t.admin.delete} disabled={busy} onClick={remove}>
            <Trash2 />
          </Button>
        )}
      </span>
    </div>
  );
}

export function ProductSizes({ product, onSaved }: Props) {
  const t = useT();
  return (
    <Panel title={t.admin.sizes} icon={Ruler}>
      <div className="overflow-x-auto">
        <div className="flex min-w-[640px] flex-col gap-2">
          <div className={`${sizeGrid} text-xs text-muted-foreground`}>
            <span>{t.admin.sizeLabel}</span>
            <span>{t.admin.sizeW}, {t.common.cm}</span>
            <span>{t.admin.sizeH}, {t.common.cm}</span>
            <span>{t.admin.sizeD}, {t.common.cm}</span>
            <span>{t.admin.priceDelta}</span>
            <span />
            <span />
          </div>
          {/* key с данными размера: после сохранения строка заново берёт значения с сервера */}
          {product.sizes.map((size) => (
            <SizeRow key={JSON.stringify(size)} productId={product.id} size={size} onSaved={onSaved} />
          ))}
          <SizeRow productId={product.id} onSaved={onSaved} />
        </div>
      </div>
    </Panel>
  );
}

export function ProductFiles({ product, onSaved }: Props) {
  const t = useT();
  const { token } = useAuth();
  const { run } = useAdminAction();
  const [uploading, setUploading] = useState<"image" | "model" | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const modelInput = useRef<HTMLInputElement>(null);

  async function upload(kind: "image" | "model", file: File | undefined) {
    if (!file) return;
    setUploading(kind);
    try {
      const { url } = await uploadFile(`/admin/uploads/${kind}`, file, token);
      const body = kind === "image" ? { images: [...product.images, url] } : { modelUrl: url };
      if (await run(`/admin/products/${product.id}`, "PATCH", body, t.admin.uploaded)) onSaved();
    } catch (error) {
      toast.error(toApiError(error).message);
    } finally {
      setUploading(null);
    }
  }

  // Убираем ссылку из товара, затем удаляем сам файл с сервера
  async function removeFile(url: string, body: object) {
    if (await run(`/admin/products/${product.id}`, "PATCH", body, t.admin.saved)) {
      await run(`/admin/uploads?url=${encodeURIComponent(url)}`, "DELETE");
      onSaved();
    }
  }

  return (
    <Panel title={t.admin.files} icon={ImageIcon}>
      <div className="flex flex-col gap-2.5">
        <h3 className="text-sm font-medium">{t.admin.photos}</h3>
        <div className="flex flex-wrap gap-3">
          {product.images.map((url) => (
            <div key={url} className="relative size-28 overflow-hidden rounded-xl border border-border bg-muted">
              <img src={fileUrl(url)} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label={t.admin.remove}
                onClick={() => removeFile(url, { images: product.images.filter((image) => image !== url) })}
                className="absolute top-1.5 right-1.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-card/90 text-foreground shadow transition-colors hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={uploading !== null}
            onClick={() => imageInput.current?.click()}
            className="flex size-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {uploading === "image" ? <LoaderCircle className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            {t.admin.uploadPhoto}
          </button>
          <input
            ref={imageInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              upload("image", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border pt-4">
        <h3 className="text-sm font-medium">{t.admin.glb}</h3>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Box className="size-5 text-muted-foreground" />
          {product.modelUrl ? (
            <>
              <a href={fileUrl(product.modelUrl)} className="text-primary hover:underline">
                {product.modelUrl.split("/").pop()}
              </a>
              <Button size="sm" variant="ghost" onClick={() => removeFile(product.modelUrl!, { modelUrl: null })}>
                {t.admin.remove}
              </Button>
            </>
          ) : (
            <span className="text-muted-foreground">{t.admin.noGlb}</span>
          )}
          <Button size="sm" variant="outline" disabled={uploading !== null} onClick={() => modelInput.current?.click()}>
            {uploading === "model" && <LoaderCircle className="animate-spin" />}
            {t.admin.uploadGlb}
          </Button>
          <input
            ref={modelInput}
            type="file"
            accept=".glb"
            hidden
            onChange={(event) => {
              upload("model", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </Panel>
  );
}
