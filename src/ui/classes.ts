import type { AuthorType, ThreadStatus } from "./types.ts";

export const STATUS_CLASS: Record<ThreadStatus, string> = {
  open: "status-open",
  addressed: "status-addressed",
  resolved: "status-resolved",
  reopened: "status-reopened",
  stale: "status-stale",
};

export const BADGE_CLASS: Record<ThreadStatus, string> = {
  open: "badge-open",
  addressed: "badge-addressed",
  resolved: "badge-resolved",
  reopened: "badge-reopened",
  stale: "badge-stale",
};

export const AUTHOR_CLASS: Record<AuthorType, string> = {
  human: "message-human",
  agent: "message-agent",
  system: "message-system",
};
