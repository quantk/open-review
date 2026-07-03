import { DEFAULT_EXCLUDE } from "../constants.ts";
import { hashText, normalizeForAnchor } from "../utils.ts";

export function parseUnifiedDiff({ raw, patchsetID, projectID, worktree, scope, diffHash }) {
  const diff = { projectID, worktree, scope, patchsetID, diffHash, generatedAt: new Date().toISOString(), files: [] };
  const lines = raw.split("\n");
  let file = null;
  let hunk = null;
  let oldNumber = 0;
  let newNumber = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("diff --git ")) {
      if (file) diff.files.push(file);
      const match = /^diff --git a\/(.*) b\/(.*)$/.exec(line);
      const oldPath = match?.[1];
      const newPath = match?.[2] || oldPath || "unknown";
      file = { fileID: hashText(`${patchsetID}:${newPath}`).slice(0, 16), oldPath, newPath, status: "modified", isBinary: false, additions: 0, deletions: 0, hunks: [] };
      hunk = null;
      continue;
    }
    if (!file) continue;
    if (line.startsWith("new file mode")) file.status = "added";
    else if (line.startsWith("deleted file mode")) file.status = "deleted";
    else if (line.startsWith("rename from ")) file.oldPath = line.slice("rename from ".length);
    else if (line.startsWith("rename to ")) {
      file.newPath = line.slice("rename to ".length);
      file.status = "renamed";
    } else if (line.startsWith("Binary files ")) {
      file.status = "binary";
      file.isBinary = true;
    } else if (line.startsWith("--- ")) {
      const p = parseDiffPath(line.slice(4));
      if (p && p !== "/dev/null") file.oldPath = p;
    } else if (line.startsWith("+++ ")) {
      const p = parseDiffPath(line.slice(4));
      if (p && p !== "/dev/null") file.newPath = p;
    } else if (line.startsWith("@@ ")) {
      const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
      if (!match) continue;
      oldNumber = Number(match[1]);
      newNumber = Number(match[3]);
      hunk = { hunkID: hashText(`${patchsetID}:${file.newPath}:${file.hunks.length}:${line}`).slice(0, 16), header: line, oldStart: oldNumber, oldLines: Number(match[2] || 1), newStart: newNumber, newLines: Number(match[4] || 1), lines: [] };
      file.hunks.push(hunk);
    } else if (hunk && (line.startsWith(" ") || line.startsWith("+") || line.startsWith("-"))) {
      let type = "context";
      let oldLine = oldNumber;
      let newLine = newNumber;
      let content = line;
      if (line.startsWith("+")) {
        type = "add";
        oldLine = null;
        content = line.slice(1);
        newNumber += 1;
        file.additions += 1;
      } else if (line.startsWith("-")) {
        type = "del";
        newLine = null;
        content = line.slice(1);
        oldNumber += 1;
        file.deletions += 1;
      } else {
        content = line.startsWith(" ") ? line.slice(1) : line;
        oldNumber += 1;
        newNumber += 1;
      }
      const contentHash = hashText(normalizeForAnchor(content));
      hunk.lines.push({ lineID: hashText(`${patchsetID}:${file.newPath}:${file.hunks.length}:${oldLine}:${newLine}:${type}:${contentHash}`).slice(0, 20), type, oldNumber: oldLine, newNumber: newLine, content, contentHash });
    }
  }
  if (file) diff.files.push(file);
  diff.files = diff.files.filter((fileDiff) => !isExcluded(fileDiff.newPath));
  return diff;
}

function parseDiffPath(value) {
  if (value === "/dev/null") return value;
  if (value.startsWith("a/") || value.startsWith("b/")) return value.slice(2);
  return value.split("\t")[0];
}

export function isExcluded(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return DEFAULT_EXCLUDE.some((pattern) => {
    if (pattern.startsWith("/")) return normalized.includes(pattern);
    if (pattern.endsWith("/")) return normalized.includes(pattern);
    if (pattern.startsWith(".")) return normalized === pattern || normalized.includes(`/${pattern}`) || normalized.endsWith(pattern);
    return normalized.endsWith(pattern) || normalized.includes(`/${pattern}`);
  });
}
