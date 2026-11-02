import type { ApiError as ApiErrorBody } from "@luxiwood/shared";
import { dictionaries, LANG_COOKIE, toLang } from "@/texts";

// Запасной текст ошибки на языке сайта. На сервере cookie здесь недоступна — там русский
function errorFallback() {
  const cookie = typeof document === "undefined" ? undefined : document.cookie.match(new RegExp(`${LANG_COOKIE}=(\\w+)`))?.[1];
  return dictionaries[toLang(cookie)].errorFallback;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Ошибка API в формате { statusCode, message, errors? }. message уже на русском
export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.status = body.statusCode;
    this.errors = body.errors ?? [];
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
};

// Запрос к API: /products → http://localhost:4000/api/products
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data ?? { statusCode: response.status, message: errorFallback() });
  }
  return data as T;
}

// Загрузка файла в админке: multipart/form-data с полем file → { url }
export async function uploadFile(path: string, file: File, token: string | null): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/api${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data ?? { statusCode: response.status, message: errorFallback() });
  }
  return data;
}

// Любая ошибка → ApiError, чтобы форма всегда могла показать понятный текст (например, если API не запущен)
export function toApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError({ statusCode: 0, message: errorFallback() });
}

// Ссылка на загруженный файл: /uploads/images/... → полный адрес на сервере API
export function fileUrl(path: string) {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}
