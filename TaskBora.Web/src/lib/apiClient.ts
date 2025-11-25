const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const normalizePath = (path: string) => path.replace(/^\//, "");
const normalizeBase = (base: string) => base.replace(/\/$/, "");

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${normalizeBase(defaultBaseUrl)}/${normalizePath(path)}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function safeApiFetch<T>(
  path: string,
  options: RequestInit = {},
  fallback?: () => Promise<T>
): Promise<T> {
  return apiFetch<T>(path, options).catch(async (error) => {
    if (fallback) {
      console.warn(`[api] falling back for ${path}:`, error);
      return fallback();
    }
    throw error;
  });
}
