// FR-005, FR-601, FR-901: API client for server communication with caching and auth
import { cachedFetch, invalidateCache } from "./apiCache";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// FR-901: Get auth headers if token exists
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("@campus-gps/auth-token");
  if (token) {
    return { ...BASE_HEADERS, Authorization: `Bearer ${token}` };
  }
  return BASE_HEADERS;
}

// FR-601: Re-export cache invalidation for manual cache busting
export { invalidateCache };

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: "POST",
    headers,
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
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: "PATCH",
    headers,
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
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: "DELETE",
    headers,
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
  const headers = await getAuthHeaders();
  const options: RequestOptions = {
    method: "GET",
    headers,
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
