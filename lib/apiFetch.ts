/**
 * Drop-in replacement for fetch() that automatically adds:
 * - ngrok-skip-browser-warning: bypasses ngrok's interstitial page
 *
 * Usage: replace `fetch(url, options)` with `apiFetch(url, options)`
 */
export async function apiFetch(
  url: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("ngrok-skip-browser-warning", "1");

  return fetch(url, { ...init, headers });
}
