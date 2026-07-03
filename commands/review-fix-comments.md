---
description: Fix open local review comments
agent: build
---

Fix all open local review comments using the local review tools.

Required workflow:

1. Call `review_list_open_threads` with `status: "open"` and `includeContext: true`.
2. Group comments by file and inspect the relevant code before editing.
3. For each thread you fix, edit the code and then call `review_mark_addressed` with:
   - `threadID`
   - a concrete `summary` of what you changed
   - `changedFiles`
4. If you cannot fix a thread, call `review_reply` on that thread explaining the blocker.
5. Do not call any resolve action. Only the human reviewer resolves threads.
6. Run relevant tests or lint if appropriate for the files you changed.

Start now by calling `review_list_open_threads`.
