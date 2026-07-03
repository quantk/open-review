# open-review

Local MR-like review UI for opencode agent changes.

It gives you a local browser review loop before commit/PR:

```text
agent edits code -> local diff UI -> human comments -> agent fixes -> human resolves
```

## Features

- Manual sidecar lifecycle: start, restart, stop.
- Local web UI on `127.0.0.1`.
- Working tree diff with staged, unstaged, and untracked files.
- Inline review comments and threaded replies.
- Agent tools for listing comments, replying, and marking comments addressed.
- Human-only resolve/reopen flow.
- Resolved thread hiding toggle.
- Basic syntax highlighting for Go, Kotlin, JavaScript/TypeScript, and Python.
- Local JSON state in `.opencode/review/`.

## Install From Git

In your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["github:quantk/open-review"]
}
```

If your opencode version does not support GitHub package specs, clone this repo and use a local path:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["/absolute/path/to/open-review/index.js"]
}
```

Restart opencode after changing config.

## Usage

Ask the agent to start the review UI:

```text
Call review_start and show me the URL.
```

Then open the returned URL.

Useful tools exposed by the plugin:

- `review_start`
- `review_restart`
- `review_stop`
- `review_list_open_threads`
- `review_get_thread`
- `review_reply`
- `review_mark_addressed`

Recommended prompt for fixing comments:

```text
Fix all open local review comments. First call review_list_open_threads.
After each fix call review_mark_addressed with a concrete summary and changedFiles.
Do not resolve comments yourself.
```

## Optional Slash Commands

This repo includes command templates under `commands/`. To use slash commands, copy them into your opencode command directory:

```text
~/.config/opencode/commands/
```

Commands included:

- `/review-start`
- `/review-restart`
- `/review-stop`
- `/review-fix-comments`

## Development

```bash
npm test
npm run check
```

Runtime entry:

```text
index.js -> src/runtime.ts
```

The current runtime uses Node's built-in TypeScript stripping. If this is packaged for older Node versions later, compile `src/**/*.ts` to `dist/**/*.js` and update `index.js` to import the built runtime.
