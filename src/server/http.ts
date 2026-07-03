import { randomBytes } from "node:crypto";
import { VERSION } from "../constants.ts";
import { parseUnifiedDiff } from "../core/diff.ts";
import { buildRawDiff, gitMaybe } from "../core/git.ts";
import { saveState } from "../core/storage.ts";
import { agentGetThread, agentListThreads, createThread, listThreads, mutateThread, reanchorThreads } from "../core/threads.ts";
import { renderAppHTML, renderHealthHTML } from "../ui/html.ts";
import { hashText, httpError, statusFromError } from "../utils.ts";

const MAX_BODY_BYTES = 1024 * 1024;

export async function handleRequest(ctx) {
  const { req, res, token } = ctx;
  const url = new URL(req.url || "/", `http://127.0.0.1:${ctx.getPort() || 0}`);

  if (url.pathname === "/" || url.pathname === "/review" || url.pathname.startsWith("/review/thread/") || url.pathname === "/settings") {
    sendHTML(res, renderAppHTML());
    return;
  }
  if (url.pathname === "/health") {
    sendHTML(res, renderHealthHTML(ctx));
    return;
  }
  if (url.pathname === "/api/events") {
    assertAuthorized(req, url, token, ctx.getPort());
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });
    res.write("event: ready\ndata: {}\n\n");
    ctx.sseClients.add(res);
    req.on("close", () => ctx.sseClients.delete(res));
    return;
  }
  if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/internal/")) {
    sendText(res, 404, "not found");
    return;
  }

  assertAuthorized(req, url, token, ctx.getPort());

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJSON(res, 200, { ok: true, version: VERSION, projectID: ctx.projectID, worktree: ctx.worktree, startedAt: ctx.startedAt });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/project") {
    const branch = await gitMaybe(ctx.worktree, ["branch", "--show-current"]);
    const headSHA = await gitMaybe(ctx.worktree, ["rev-parse", "--short", "HEAD"]);
    sendJSON(res, 200, { projectID: ctx.projectID, name: ctx.projectName, worktree: ctx.worktree, git: { root: ctx.worktree, branch: branch.trim(), headSHA: headSHA.trim() } });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/diff") {
    const scope = url.searchParams.get("scope") || "working_tree";
    const result = await refreshDiff({ state: ctx.state, storagePath: ctx.storagePath, worktree: ctx.worktree, projectID: ctx.projectID, scope, sseClients: ctx.sseClients });
    sendJSON(res, 200, { reviewID: ctx.state.reviewID, patchsetID: ctx.state.currentPatchsetID, diffHash: ctx.state.latestDiffHash, scope, files: result.diff.files });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/diff/refresh") {
    const body = await readBody(req);
    const result = await refreshDiff({ state: ctx.state, storagePath: ctx.storagePath, worktree: ctx.worktree, projectID: ctx.projectID, scope: body.scope || "working_tree", sseClients: ctx.sseClients });
    sendJSON(res, 200, { changed: result.changed, patchsetID: ctx.state.currentPatchsetID, reanchoredThreads: result.reanchoredThreads, staleThreads: result.staleThreads });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/threads") {
    const status = (url.searchParams.get("status") || "open,addressed,reopened,stale").split(",").filter(Boolean);
    const filePath = url.searchParams.get("filePath");
    const threads = listThreads(ctx.state, { status, filePath, includeResolved: status.includes("resolved") || status.includes("all") });
    sendJSON(res, 200, { threads });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/threads") {
    const body = await readBody(req);
    const thread = createThread(ctx.state, body);
    await saveState(ctx.storagePath, ctx.state);
    emitSSE(ctx.sseClients, { type: "thread.created", threadID: thread.id });
    sendJSON(res, 200, { thread });
    return;
  }

  const threadAction = matchThreadAction(url.pathname);
  if (threadAction && req.method === "POST") {
    const body = await readBody(req);
    const result = await mutateThread({ ...ctx, saveState, emitSSE }, threadAction.threadID, threadAction.action, body);
    sendJSON(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/agent/threads") {
    const body = await readBody(req);
    const result = await agentListThreads(ctx, body);
    sendJSON(res, 200, result);
    return;
  }
  const agentMatch = matchAgentThread(url.pathname);
  if (agentMatch && req.method === "POST") {
    const body = await readBody(req);
    if (agentMatch.action === "get") sendJSON(res, 200, await agentGetThread(ctx, agentMatch.threadID, body));
    else if (agentMatch.action === "reply") sendJSON(res, 200, await mutateThread({ ...ctx, saveState, emitSSE }, agentMatch.threadID, "agent_reply", body));
    else if (agentMatch.action === "addressed") sendJSON(res, 200, await mutateThread({ ...ctx, saveState, emitSSE }, agentMatch.threadID, "addressed", { ...body, actorType: "agent" }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/internal/opencode/event") {
    await refreshDiff({ state: ctx.state, storagePath: ctx.storagePath, worktree: ctx.worktree, projectID: ctx.projectID, scope: "working_tree", sseClients: ctx.sseClients });
    sendJSON(res, 200, { ok: true });
    return;
  }

  sendJSON(res, 404, { error: "not found" });
}

export async function refreshDiff({ state, storagePath, worktree, projectID, scope, sseClients }) {
  const raw = await buildRawDiff(worktree, scope);
  const diffHash = `sha256:${hashText(raw)}`;
  const previousPatchsetID = state.currentPatchsetID;
  if (state.latestDiffHash === diffHash && previousPatchsetID) {
    return { changed: false, diff: state.patchsets[previousPatchsetID].diff, reanchoredThreads: 0, staleThreads: 0 };
  }

  const patchsetID = `ps_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
  const diff = parseUnifiedDiff({ raw, patchsetID, projectID, worktree, scope, diffHash });
  const sequence = Object.keys(state.patchsets).length + 1;
  state.patchsets[patchsetID] = { id: patchsetID, reviewID: state.reviewID, sequence, scope, diffHash, diff, createdAt: new Date().toISOString(), source: "git" };
  state.currentPatchsetID = patchsetID;
  state.latestDiffHash = diffHash;
  const reanchor = reanchorThreads(state, patchsetID);
  await saveState(storagePath, state);
  emitSSE(sseClients, { type: "diff.changed", patchsetID, diffHash });
  for (const id of reanchor.reanchoredIDs) emitSSE(sseClients, { type: "thread.reanchored", threadID: id });
  for (const id of reanchor.staleIDs) emitSSE(sseClients, { type: "thread.stale", threadID: id });
  return { changed: true, diff, reanchoredThreads: reanchor.reanchoredIDs.length, staleThreads: reanchor.staleIDs.length };
}

export async function callJSON(server, route, options) {
  const response = await fetch(`${server.url}${route}`, {
    method: options.method,
    signal: options.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
    headers: {
      authorization: `Bearer ${server.token}`,
      "content-type": "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(body?.error || `${response.status} ${response.statusText}`);
  return body;
}

function assertAuthorized(req, url, token, port) {
  const origin = req.headers.origin;
  if (origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(origin)) throw httpError(403, "invalid origin");
  const auth = req.headers.authorization || "";
  const queryToken = url.searchParams.get("token");
  if (auth === `Bearer ${token}` || queryToken === token) return;
  throw httpError(401, "unauthorized");
}

export function sendJSON(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

function sendHTML(res, body) {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
}

function sendText(res, status, body) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

export function emitSSE(clients, event) {
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) client.write(payload);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw httpError(413, "request body too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw httpError(400, "malformed JSON body");
  }
}

function matchThreadAction(pathname) {
  const match = /^\/api\/threads\/([^/]+)\/(messages|addressed|resolve|reopen)$/.exec(pathname);
  if (!match) return null;
  return { threadID: decodeURIComponent(match[1]), action: match[2] };
}

function matchAgentThread(pathname) {
  let match = /^\/api\/agent\/threads\/([^/]+)$/.exec(pathname);
  if (match) return { threadID: decodeURIComponent(match[1]), action: "get" };
  match = /^\/api\/agent\/threads\/([^/]+)\/(reply|addressed)$/.exec(pathname);
  if (match) return { threadID: decodeURIComponent(match[1]), action: match[2] };
  return null;
}

export { httpError, statusFromError };
