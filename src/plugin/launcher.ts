import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_HOST } from "../constants.ts";
import { ensureReviewDir, readJSON, writeJSON } from "../core/storage.ts";
import { callJSON } from "../server/http.ts";

const runtimeFile = sidecarEntryFile();

export async function ensureServer(input) {
  const reviewDir = await ensureReviewDir(input.worktree);
  const lockPath = path.join(reviewDir, "server.json");
  const existing = await readJSON(lockPath, null);
  if (existing?.url && existing?.token) {
    try {
      const health = await callJSON(existing, "/api/health", { method: "GET" });
      if (health?.ok && health?.worktree === input.worktree) {
        return {
          url: existing.url,
          token: existing.token,
          reviewUrl: `${existing.url}/review?token=${encodeURIComponent(existing.token)}`,
        };
      }
    } catch {}
  }

  const token = randomBytes(24).toString("base64url");
  const logPath = path.join(reviewDir, "server.log");
  const runtime = sidecarRuntime();
  await fs.appendFile(logPath, `[${new Date().toISOString()}] starting local review sidecar with ${runtime}\n`).catch(() => {});
  const env = {
    ...process.env,
    LOCAL_REVIEW_PROJECT_ID: input.projectID,
    LOCAL_REVIEW_PROJECT_NAME: input.projectName,
    LOCAL_REVIEW_WORKTREE: input.worktree,
    LOCAL_REVIEW_HOST: DEFAULT_HOST,
    LOCAL_REVIEW_TOKEN: token,
    LOCAL_REVIEW_STORAGE: path.join(reviewDir, "review-state.json"),
  };

  const child = spawn(runtime, [runtimeFile, "--local-review-server"], {
    cwd: input.worktree,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  child.stderr.on("data", (chunk) => {
    const text = String(chunk).trim();
    fs.appendFile(logPath, `[stderr] ${String(chunk)}`).catch(() => {});
    if (text) console.error(`[opencode-local-review] ${text}`);
  });
  child.on("error", (error) => {
    fs.appendFile(logPath, `[${new Date().toISOString()}] spawn error: ${error.message || String(error)}\n`).catch(() => {});
  });
  child.stdout.on("data", (chunk) => {
    const text = String(chunk);
    if (!text.startsWith("READY ")) fs.appendFile(logPath, `[stdout] ${text}`).catch(() => {});
  });

  let ready;
  try {
    ready = await waitForReady(child);
  } catch (error) {
    await fs.appendFile(logPath, `[${new Date().toISOString()}] failed: ${error.message || String(error)}\n`).catch(() => {});
    throw error;
  }
  const record = { url: ready.url, token, pid: child.pid, worktree: input.worktree, startedAt: new Date().toISOString() };
  await writeJSON(lockPath, record, { mode: 0o600 });

  return { url: ready.url, token, reviewUrl: `${ready.url}/review?token=${encodeURIComponent(token)}` };
}

export async function restartServer(input) {
  await stopServer(input);
  await new Promise((resolve) => setTimeout(resolve, 150));
  return ensureServer(input);
}

export async function stopServer(input) {
  const reviewDir = await ensureReviewDir(input.worktree);
  const lockPath = path.join(reviewDir, "server.json");
  const existing = await readJSON(lockPath, null);
  if (existing?.pid) {
    try {
      process.kill(existing.pid, "SIGTERM");
    } catch {}
  }
  await fs.rm(lockPath, { force: true }).catch(() => {});
}

function sidecarRuntime() {
  const override = process.env.OPENCODE_LOCAL_REVIEW_NODE;
  if (override) return override;
  const executable = path.basename(process.execPath).toLowerCase();
  if (executable.includes("opencode")) return "node";
  return process.execPath;
}

function sidecarEntryFile() {
  const currentFile = fileURLToPath(import.meta.url);
  if (currentFile.endsWith(`${path.sep}launcher.ts`)) {
    return fileURLToPath(new URL("../runtime.ts", import.meta.url));
  }
  return currentFile;
}

function waitForReady(child) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let buffer = "";
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const timer = setTimeout(() => finish(reject, new Error("local review server did not start within 2s")), 2000);
    child.on("error", (error) => finish(reject, error));
    child.on("exit", (code) => {
      finish(reject, new Error(`local review server exited before ready: ${code}`));
    });
    child.stdout.on("data", (chunk) => {
      buffer += String(chunk);
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("READY ")) continue;
        finish(resolve, JSON.parse(line.slice("READY ".length)));
      }
    });
  });
}
