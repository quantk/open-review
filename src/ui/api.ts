export async function api<T>(path: string, options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}): Promise<T> {
  const token = authToken();
  const res = await fetch(path, {
    ...options,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json", ...(options.headers || {}) },
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body as BodyInit | undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

export function bootstrapTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get("token");
  if (!queryToken) return;
  window.localStorage.setItem("localReviewToken", queryToken);
  params.delete("token");
  window.history.replaceState(null, "", window.location.pathname + (params.toString() ? `?${params.toString()}` : "") + window.location.hash);
}

export function authToken() {
  return window.localStorage.getItem("localReviewToken") || "";
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}
