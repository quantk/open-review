export const VERSION = "0.1.0-local";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_CONTEXT_LINES = 80;
export const REANCHOR_CONTEXT_LINES = 5;
export const MAX_TOTAL_DIFF_BYTES = 5 * 1024 * 1024;
export const MAX_UNTRACKED_FILE_BYTES = 256 * 1024;

export const DEFAULT_EXCLUDE = [
  ".env",
  ".env.",
  ".pem",
  ".key",
  "id_rsa",
  "id_ed25519",
  "/.aws/",
  "/.config/gcloud/",
  "/node_modules/",
  "/dist/",
  "/build/",
  "/.next/",
  "/coverage/",
  "/.opencode/review/",
  ".opencode/review/",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  ".snap",
] as const;
