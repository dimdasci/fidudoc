import { getSession } from "@features/auth";

/**
 * HTTP client that automatically injects authentication token
 */
export async function fetchWithAuth(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const session = await getSession();

  const headers = new Headers(options?.headers);

  if (session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  return fetch(url, {
    ...options,
    headers: Object.fromEntries(headers.entries()),
  });
}

/**
 * Typed JSON fetch with authentication
 */
export async function fetchJSON<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
