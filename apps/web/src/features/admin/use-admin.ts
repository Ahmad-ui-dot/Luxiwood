"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// Загрузка данных админки с токеном. path = null — ничего не грузим. reload() — загрузить заново после изменений
export function useAdminQuery<T>(path: string | null) {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path || !token) return;
    let cancelled = false;
    api<T>(path, { token })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((caught) => {
        if (!cancelled) setError(toApiError(caught).message);
      });
    return () => {
      cancelled = true;
    };
  }, [path, token, version]);

  return { data, error, reload: () => setVersion((current) => current + 1) };
}

type Method = "POST" | "PATCH" | "PUT" | "DELETE";

// Изменение данных: показывает уведомление об успехе или текст ошибки от API. При ошибке возвращает null
export function useAdminAction() {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);

  async function run<T>(path: string, method: Method, body?: unknown, success?: string): Promise<T | null> {
    setBusy(true);
    try {
      const result = await api<T>(path, { method, body, token });
      if (success) toast.success(success);
      return result;
    } catch (caught) {
      const error = toApiError(caught);
      toast.error(error.message, error.errors.length > 0 ? { description: error.errors.join(" · ") } : undefined);
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy };
}
