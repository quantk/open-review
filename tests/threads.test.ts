import test from "node:test";
import assert from "node:assert/strict";
import { parseUnifiedDiff } from "../src/core/diff.ts";
import { applyThreadMutation, createThread } from "../src/core/threads.ts";

function makeState() {
  const patchsetID = "ps_test";
  const raw = [
    "diff --git a/main.go b/main.go",
    "--- a/main.go",
    "+++ b/main.go",
    "@@ -1,1 +1,2 @@",
    " package main",
    "+func main() {}",
    "",
  ].join("\n");
  const diff = parseUnifiedDiff({ raw, patchsetID, projectID: "proj_test", worktree: "/repo", scope: "working_tree", diffHash: "sha256:test" });

  return {
    version: 1,
    project: { projectID: "proj_test", projectName: "test", worktree: "/repo" },
    reviewID: "rev_test",
    currentPatchsetID: patchsetID,
    latestDiffHash: "sha256:test",
    patchsets: { [patchsetID]: { id: patchsetID, diff } },
    threads: {},
    messages: {},
    events: [],
  };
}

test("human reply after addressed reopens thread", () => {
  const state = makeState();
  const thread = createThread(state, {
    patchsetID: "ps_test",
    filePath: "main.go",
    side: "new",
    startLine: 2,
    endLine: 2,
    message: "add logging",
    selectedText: ["func main() {}"],
  });

  applyThreadMutation(state, thread.id, "addressed", { summary: "Added logging", changedFiles: ["main.go"] });
  assert.equal(state.threads[thread.id].status, "addressed");

  applyThreadMutation(state, thread.id, "messages", { actorType: "human", body: "still missing error logs" });
  assert.equal(state.threads[thread.id].status, "open");
  assert.equal(state.messages[thread.id].at(-1).body, "still missing error logs");
});
