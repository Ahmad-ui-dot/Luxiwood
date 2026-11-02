"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { AdminUser } from "../types";
import { useAdminAction, useAdminQuery } from "../use-admin";
import { actionsTdClass, ConfirmButton, Field, fieldClass, FormDialog, IconButton, Loading, PageTitle, Panel, tableClass, tdClass, thClass } from "./ui";
import { useT } from "@/lib/i18n";

const emptyForm = { name: "", email: "", password: "" };

export function AdminsPage() {
  const t = useT();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data, error, reload } = useAdminQuery<AdminUser[]>("/admin/admins");
  const { run, busy } = useAdminAction();
  const [open, setOpen] = useState(false);
  // null — добавляем нового администратора, иначе — меняем этого
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  function openForm(admin: AdminUser | null) {
    setEditing(admin);
    setForm(admin ? { name: admin.name, email: admin.email ?? "", password: "" } : emptyForm);
    setOpen(true);
  }

  async function save() {
    // Пустые поля не отправляем: пустой пароль — «не менять»
    const body = { name: form.name.trim(), email: form.email.trim() || undefined, password: form.password || undefined };
    if (!editing) {
      if (await run("/admin/admins", "POST", body, t.admin.saved)) {
        setOpen(false);
        reload();
      }
      return;
    }
    if (!(await run(`/admin/admins/${editing.id}`, "PATCH", body, t.admin.saved))) return;
    setOpen(false);
    // Свой пароль сменили — старый вход больше не действует, входим заново
    if (editing.id === user?.id && body.password) {
      signOut();
      toast.info(t.admin.reloginTitle);
      router.push("/login");
      return;
    }
    reload();
  }

  async function remove(admin: AdminUser) {
    if (await run(`/admin/admins/${admin.id}`, "DELETE", undefined, t.admin.deleted)) reload();
  }

  return (
    <>
      <PageTitle title={t.admin.nav.admins} description={t.admin.adminsHint}>
        <Button size="lg" className="px-4" onClick={() => openForm(null)}>
          <Plus />
          {t.admin.newAdmin}
        </Button>
      </PageTitle>

      {!data ? (
        <Loading error={error} />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>{t.admin.login}</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>{t.admin.registered}</th>
                  <th className={`${thClass} text-right`}>{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((admin) => (
                  <tr key={admin.id} className="transition-colors hover:bg-muted/50">
                    <td className={tdClass}>
                      <span className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary uppercase">{admin.name[0]}</span>
                        <span className="font-medium">{admin.name}</span>
                        {admin.id === user?.id && <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-xs text-primary">{t.admin.you}</span>}
                      </span>
                    </td>
                    <td className={`${tdClass} text-muted-foreground`}>{admin.email ?? "—"}</td>
                    <td className={`${tdClass} whitespace-nowrap text-muted-foreground`}>{t.date(admin.createdAt)}</td>
                    <td className={actionsTdClass}>
                      <IconButton label={t.admin.edit} onClick={() => openForm(admin)}>
                        <Pencil />
                      </IconButton>
                      {admin.id !== user?.id && (
                        <ConfirmButton icon onConfirm={() => remove(admin)} disabled={busy}>
                          {t.admin.delete}
                        </ConfirmButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <FormDialog open={open} onOpenChange={setOpen} title={editing ? t.admin.editAdmin : t.admin.newAdmin} busy={busy} onSubmit={save}>
        <Field label={t.admin.login}>
          <input required autoFocus minLength={2} value={form.name} onChange={(event) => set({ name: event.target.value })} className={fieldClass} />
        </Field>
        <Field label={t.admin.email}>
          <input type="email" value={form.email} onChange={(event) => set({ email: event.target.value })} className={fieldClass} />
        </Field>
        <Field label={editing ? t.admin.newPassword : t.admin.password} hint={editing ? t.admin.keepPassword : undefined}>
          <input
            type="password"
            required={!editing}
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => set({ password: event.target.value })}
            className={fieldClass}
          />
        </Field>
      </FormDialog>
    </>
  );
}
