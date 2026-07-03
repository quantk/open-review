import { VERSION } from "../constants.ts";
import { escapeHTML } from "../utils.ts";
import { APP_SCRIPT, APP_STYLES } from "./generated/assets.ts";

export function renderAppHTML() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>OpenCode Local Review</title>
  <style>${APP_STYLES}</style>
</head>
<body>
  <div id="root"></div>
  <script>${APP_SCRIPT}</script>
</body>
</html>`;
}

export function renderHealthHTML(ctx) {
  return `<!doctype html><meta charset="utf-8"><title>Local Review Health</title><pre>${escapeHTML(JSON.stringify({ ok: true, version: VERSION, projectID: ctx.projectID, worktree: ctx.worktree, startedAt: ctx.startedAt }, null, 2))}</pre>`;
}
