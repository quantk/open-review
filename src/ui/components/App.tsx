import { useEffect, useState } from "react";
import { api, authToken, errorMessage } from "../api.ts";
import { lineAnchorID, threadAnchorID } from "../dom.ts";
import { useStoredBoolean } from "../hooks.ts";
import type { DiffResponse, PendingComment, ReviewThread, ThreadsResponse } from "../types.ts";
import { DiffView } from "./DiffView.tsx";
import { FilesSidebar } from "./FilesSidebar.tsx";
import { ThreadsSidebar } from "./ThreadsSidebar.tsx";
import { TopBar } from "./TopBar.tsx";

export function App() {
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [threads, setThreads] = useState<ReviewThread[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingComment | null>(null);
  const [replyingThreadID, setReplyingThreadID] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useStoredBoolean("localReviewShowResolved", false);
  const [leftCollapsed, setLeftCollapsed] = useStoredBoolean("localReviewLeftCollapsed", false);
  const [rightCollapsed, setRightCollapsed] = useStoredBoolean("localReviewRightCollapsed", false);
  const [error, setError] = useState<string | null>(null);
  const [sseWarning, setSSEWarning] = useState<string | null>(null);

  async function load() {
    const nextDiff = await api<DiffResponse>("/api/diff?scope=working_tree");
    const nextThreads = await api<ThreadsResponse>("/api/threads?status=open,addressed,reopened,stale,resolved");
    setDiff(nextDiff);
    setThreads(nextThreads.threads || []);
    setCurrentFile((previous) => {
      const fileNames = nextDiff.files.map((file) => file.newPath);
      return previous && fileNames.includes(previous) ? previous : nextDiff.files[0]?.newPath || null;
    });
    setError(null);
  }

  useEffect(() => {
    void load().catch((err) => setError(errorMessage(err)));
    const token = authToken();
    if (!token) return undefined;
    const events = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
    const reload = () => void load().catch((err) => setError(errorMessage(err)));
    events.onopen = () => setSSEWarning(null);
    events.onmessage = reload;
    events.addEventListener("diff.changed", reload);
    events.addEventListener("thread.updated", reload);
    events.addEventListener("thread.created", reload);
    events.onerror = () => setSSEWarning("Live updates disconnected. The browser will keep trying to reconnect; use Refresh diff if needed.");
    return () => events.close();
  }, []);

  const visibleThreads = threads.filter((thread) => showResolved || thread.status !== "resolved");

  async function refreshDiff() {
    await api("/api/diff/refresh", { method: "POST", body: { scope: "working_tree" } });
    await load();
  }

  async function createThread(input: PendingComment, message: string) {
    await api("/api/threads", {
      method: "POST",
      body: { ...input, startLine: input.line, endLine: input.line, message, authorName: "human" },
    });
    setPending(null);
    await load();
  }

  async function resolveThread(threadID: string) {
    await api(`/api/threads/${threadID}/resolve`, { method: "POST", body: { actorType: "human" } });
    await load();
  }

  async function reopenThread(threadID: string) {
    const message = window.prompt("Reopen message") || "";
    await api(`/api/threads/${threadID}/reopen`, { method: "POST", body: { actorType: "human", message } });
    await load();
  }

  async function replyToThread(threadID: string, body: string) {
    await api(`/api/threads/${threadID}/messages`, { method: "POST", body: { actorType: "human", authorName: "human", body } });
    setReplyingThreadID(null);
    await load();
  }

  function scrollToThread(thread: ReviewThread) {
    if (thread.filePath !== currentFile) setCurrentFile(thread.filePath);
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const threadNode = document.getElementById(threadAnchorID(thread.id));
        const lineNode = document.getElementById(lineAnchorID(thread.filePath, thread.side, thread.currentLine ?? thread.originalLine));
        (threadNode || lineNode)?.scrollIntoView({ block: "center", behavior: "smooth" });
        threadNode?.animate([{ outline: "2px solid #8ad0ff" }, { outline: "2px solid transparent" }], { duration: 1200, easing: "ease-out" });
      });
    }, 0);
  }

  const layoutClassName = ["layout-grid", leftCollapsed ? "left-collapsed" : "", rightCollapsed ? "right-collapsed" : ""].filter(Boolean).join(" ");

  return (
    <div className="app-shell" data-open-review-app="react-tailwind">
      <TopBar
        diff={diff}
        leftCollapsed={leftCollapsed}
        rightCollapsed={rightCollapsed}
        showResolved={showResolved}
        onToggleLeft={() => setLeftCollapsed(!leftCollapsed)}
        onToggleRight={() => setRightCollapsed(!rightCollapsed)}
        onShowResolvedChange={setShowResolved}
        onRefresh={() => void refreshDiff().catch((err) => setError(errorMessage(err)))}
        sseWarning={sseWarning}
      />
      <div id="layout" className={layoutClassName}>
        <FilesSidebar diff={diff} currentFile={currentFile} onSelectFile={setCurrentFile} />
        <DiffView
          diff={diff}
          currentFile={currentFile}
          pending={pending}
          visibleThreads={visibleThreads}
          replyingThreadID={replyingThreadID}
          error={error}
          onOpenComposer={setPending}
          onCancelComposer={() => setPending(null)}
          onCreateThread={(input, message) => void createThread(input, message).catch((err) => setError(errorMessage(err)))}
          onReplyOpen={setReplyingThreadID}
          onReplyCancel={() => setReplyingThreadID(null)}
          onReplySend={(threadID, body) => void replyToThread(threadID, body).catch((err) => setError(errorMessage(err)))}
          onResolve={(threadID) => void resolveThread(threadID).catch((err) => setError(errorMessage(err)))}
          onReopen={(threadID) => void reopenThread(threadID).catch((err) => setError(errorMessage(err)))}
        />
        <ThreadsSidebar
          threads={visibleThreads}
          replyingThreadID={replyingThreadID}
          onScrollToThread={scrollToThread}
          onReplyOpen={setReplyingThreadID}
          onReplyCancel={() => setReplyingThreadID(null)}
          onReplySend={(threadID, body) => void replyToThread(threadID, body).catch((err) => setError(errorMessage(err)))}
          onResolve={(threadID) => void resolveThread(threadID).catch((err) => setError(errorMessage(err)))}
          onReopen={(threadID) => void reopenThread(threadID).catch((err) => setError(errorMessage(err)))}
        />
      </div>
    </div>
  );
}
