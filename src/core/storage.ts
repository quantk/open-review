import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { hashText, httpError } from "../utils.ts";

export async function loadState(storagePath, project) {
  const existing = await readJSON(storagePath, null);
  if (existing?.version === 1) return existing;
  return {
    version: 1,
    project,
    reviewID: `rev_${hashText(project.worktree).slice(0, 12)}`,
    currentPatchsetID: null,
    latestDiffHash: null,
    patchsets: {},
    threads: {},
    messages: {},
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function saveState(storagePath, state) {
  state.updatedAt = new Date().toISOString();
  await writeJSON(storagePath, state, { mode: 0o600 });
}

export async function readJSON(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

export async function writeJSON(file, value, options = {}) {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), { mode: options.mode || 0o600 });
  await fs.rename(tmp, file);
}

export async function ensureReviewDir(worktree) {
  const local = path.join(worktree, ".opencode", "review");
  try {
    await fs.mkdir(local, { recursive: true, mode: 0o700 });
    return local;
  } catch {
    const fallback = path.join(os.homedir(), ".local", "share", "opencode-local-review", hashText(worktree).slice(0, 16));
    await fs.mkdir(fallback, { recursive: true, mode: 0o700 });
    return fallback;
  }
}

export function safeJoin(root, relative) {
  const absolute = path.resolve(root, relative);
  const normalizedRoot = path.resolve(root) + path.sep;
  if (absolute !== path.resolve(root) && !absolute.startsWith(normalizedRoot)) throw httpError(400, "path escapes worktree");
  return absolute;
}

export function requireRelativePath(filePath) {
  if (!filePath || path.isAbsolute(filePath) || filePath.includes("..")) throw httpError(400, "invalid file path");
  return filePath.replace(/\\/g, "/");
}
