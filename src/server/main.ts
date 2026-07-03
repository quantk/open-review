import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { DEFAULT_HOST } from "../constants.ts";
import { loadState } from "../core/storage.ts";
import { requiredEnv, statusFromError } from "../utils.ts";
import { handleRequest, refreshDiff, sendJSON } from "./http.ts";

export async function runSidecar() {
  const projectID = requiredEnv("LOCAL_REVIEW_PROJECT_ID");
  const projectName = process.env.LOCAL_REVIEW_PROJECT_NAME || path.basename(requiredEnv("LOCAL_REVIEW_WORKTREE"));
  const worktree = requiredEnv("LOCAL_REVIEW_WORKTREE");
  const token = requiredEnv("LOCAL_REVIEW_TOKEN");
  const storagePath = requiredEnv("LOCAL_REVIEW_STORAGE");
  const host = process.env.LOCAL_REVIEW_HOST || DEFAULT_HOST;
  const startedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(storagePath), { recursive: true, mode: 0o700 });

  const state = await loadState(storagePath, { projectID, projectName, worktree });
  const sseClients = new Set();
  let currentPort = 0;

  const server = http.createServer(async (req, res) => {
    try {
      await handleRequest({ req, res, projectID, projectName, worktree, token, storagePath, state, startedAt, sseClients, getPort: () => currentPort });
    } catch (error) {
      sendJSON(res, statusFromError(error), { error: error.message || String(error) });
    }
  });

  server.listen(0, host, async () => {
    const address = server.address();
    currentPort = typeof address === "object" && address ? address.port : 0;
    const url = `http://${host}:${currentPort}`;
    await refreshDiff({ state, storagePath, worktree, projectID, scope: "working_tree", sseClients });
    console.log(`READY ${JSON.stringify({ url, projectID, worktree })}`);
  });
}
