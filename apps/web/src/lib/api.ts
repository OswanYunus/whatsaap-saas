/**
 * Thin fetch wrapper for talking to the API. Kept intentionally
 * minimal at this scaffolding stage — no interceptors, no automatic
 * refresh-token flow yet. Both will be added once the auth pages are
 * implemented.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}