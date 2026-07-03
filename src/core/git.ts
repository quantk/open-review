import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { DEFAULT_CONTEXT_LINES, MAX_TOTAL_DIFF_BYTES, MAX_UNTRACKED_FILE_BYTES } from "../constants.ts";
import { redactSecrets } from "../utils.ts";
import { isExcluded } from "./diff.ts";
import { requireRelativePath, safeJoin } from "./storage.ts";

export async function getGitRoot(cwd) {
  try {
    return (await git(cwd, ["rev-parse", "--show-toplevel"])).trim();
  } catch {
    return null;
  }
}

export function git(cwd, args) {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout);
    });
  });
}

export async function gitMaybe(cwd, args) {
  try {
    return await git(cwd, args);
  } catch {
    return "";
  }
}

export async function buildRawDiff(worktree, scope) {
  const argsBase = ["--no-color", "--no-ext-diff", "--find-renames", "--find-copies", `--unified=${DEFAULT_CONTEXT_LINES}`];
  const chunks = [];
  if (scope === "working_tree" || scope === "unstaged") chunks.push(await git(worktree, ["diff", ...argsBase]));
  if (scope === "working_tree" || scope === "staged") chunks.push(await git(worktree, ["diff", "--cached", ...argsBase]));
  if (scope === "working_tree") chunks.push(await syntheticUntrackedDiff(worktree));
  const raw = chunks.filter(Boolean).join("\n");
  if (Buffer.byteLength(raw, "utf8") > MAX_TOTAL_DIFF_BYTES) return raw.slice(0, MAX_TOTAL_DIFF_BYTES) + "\n# opencode-local-review: diff truncated by maxTotalDiffBytes\n";
  return raw;
}

async function syntheticUntrackedDiff(worktree) {
  const output = await git(worktree, ["ls-files", "--others", "--exclude-standard", "-z"]);
  const files = output.split("\0").filter(Boolean).filter((file) => !isExcluded(file));
  const chunks = [];
  for (const file of files) {
    const absolute = safeJoin(worktree, file);
    const stat = await fs.stat(absolute).catch(() => null);
    if (!stat || !stat.isFile() || stat.size > MAX_UNTRACKED_FILE_BYTES) continue;
    const buffer = await fs.readFile(absolute);
    if (buffer.includes(0)) continue;
    const text = buffer.toString("utf8");
    const lines = text.split("\n");
    const body = lines.map((line) => `+${line}`).join("\n");
    chunks.push(`diff --git a/${file} b/${file}\nnew file mode 100644\n--- /dev/null\n+++ b/${file}\n@@ -0,0 +1,${lines.length} @@\n${body}\n`);
  }
  return chunks.join("\n");
}

export async function readSnippet(worktree, filePath, lineNumber, radius) {
  try {
    const absolute = safeJoin(worktree, requireRelativePath(filePath));
    const text = await fs.readFile(absolute, "utf8");
    const lines = text.split("\n");
    const start = Math.max(1, lineNumber - radius);
    const end = Math.min(lines.length, lineNumber + radius);
    return lines.slice(start - 1, end).map((content, index) => `${start + index}: ${redactSecrets(content)}`);
  } catch {
    return [];
  }
}
