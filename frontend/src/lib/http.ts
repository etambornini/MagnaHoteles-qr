import { env } from "@/config/env";

export type ApiErrorPayload = {
  message?: string;
  [key: string]: unknown;
};

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(status: number, payload: ApiErrorPayload | null, message?: string) {
    super(message ?? payload?.message ?? "Unexpected API error");
    this.status = status;
    this.payload = payload;
  }
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

const buildUrl = (path: string, query?: ApiRequestOptions["query"]) => {
  const base = env.apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(`${normalizedPath}`, `${base}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }
  return url;
};

const isFormData = (value: unknown): value is FormData => {
  return typeof FormData !== "undefined" && value instanceof FormData;
};

export const apiFetch = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { method = "GET", headers = {}, query, body, token, signal } = options;
  const url = buildUrl(path, query);

  const mergedHeaders = new Headers(headers);

  let requestBody: BodyInit | null | undefined;

  if (body !== undefined) {
    if (isFormData(body)) {
      mergedHeaders.delete("Content-Type");
      requestBody = body;
    } else {
      if (!mergedHeaders.has("Content-Type")) {
        mergedHeaders.set("Content-Type", "application/json");
      }
      requestBody = JSON.stringify(body);
    }
  }

  if (token) {
    mergedHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method,
    headers: mergedHeaders,
    body: requestBody ?? undefined,
    signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload, payload?.message as string | undefined);
  }

  return payload as T;
};
