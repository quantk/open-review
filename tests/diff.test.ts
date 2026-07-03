import test from "node:test";
import assert from "node:assert/strict";
import { isExcluded, parseUnifiedDiff } from "../src/core/diff.ts";

test("parseUnifiedDiff parses added lines and metadata", () => {
  const raw = [
    "diff --git a/main.go b/main.go",
    "--- a/main.go",
    "+++ b/main.go",
    "@@ -1,2 +1,3 @@",
    " package main",
    "+func main() {}",
    "",
  ].join("\n");

  const diff = parseUnifiedDiff({
    raw,
    patchsetID: "ps_test",
    projectID: "proj_test",
    worktree: "/repo",
    scope: "working_tree",
    diffHash: "sha256:test",
  });

  assert.equal(diff.files.length, 1);
  assert.equal(diff.files[0].newPath, "main.go");
  assert.equal(diff.files[0].additions, 1);
  assert.equal(diff.files[0].hunks[0].lines.find((line) => line.type === "add")?.content, "func main() {}");
});

test("isExcluded hides local review state", () => {
  assert.equal(isExcluded(".opencode/review/server.json"), true);
  assert.equal(isExcluded("src/main.go"), false);
});
