// FR-005, FR-601: API client for server communication with caching
import { cachedFetch, invalidateCache } from "./apiCache";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://unexcludable-blythe-starchily.ngrok-free.dev/api";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
}

// Headers comunes — incluye ngrok-skip-browser-warning para tunnels
const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

// FR-601: Re-export cache invalidation for manual cache busting
export { invalidateCache };

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: BASE_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: BASE_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: BASE_HEADERS,
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message =
      data?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// FR-601: Raw GET without cache (for internal use by cachedFetch)
async function rawGet<T>(url: string): Promise<T> {
  const options: RequestOptions = {
    method: "GET",
    headers: { ...BASE_HEADERS },
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// FR-601: GET with in-memory cache (30s TTL) and request deduplication
export async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  return cachedFetch<T>(path, () => rawGet<T>(url));
}
