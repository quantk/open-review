import { createHash } from "node:crypto";

export function normalizeForAnchor(line: string): string {
  return String(line || "").trim().replace(/\s+/g, " ");
}

export function hashSelectedText(lines: string[]): string {
  return hashText((lines || []).map(normalizeForAnchor).join("\n"));
}

export function hashText(text: unknown): string {
  return createHash("sha256").update(String(text)).digest("hex");
}

export function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function redactSecrets(line: unknown): string {
  return String(line).replace(/(api[_-]?key|token|secret|password)(\s*[:=]\s*)["']?[^"'\s]+/gi, "$1$2[REDACTED]");
}

export function parseCookie(cookie: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of cookie.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}

export function escapeHTML(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] ?? ch);
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing ${name}`);
  return value;
}

export function httpError(status: number, message: string): Error & { status?: number } {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export function statusFromError(error: unknown): number {
  return (error as { status?: number } | null)?.status || 500;
}
