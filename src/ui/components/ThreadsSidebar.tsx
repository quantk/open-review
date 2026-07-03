import type { KeyboardEvent, MouseEvent } from "react";
import { STATUS_CLASS } from "../classes.ts";
import type { ReviewThread, ThreadActionsProps } from "../types.ts";
import { ThreadActions, ThreadHeader, ThreadMessages } from "./ThreadParts.tsx";

type ThreadsSidebarProps = ThreadActionsProps & {
  threads: ReviewThread[];
  onScrollToThread: (thread: ReviewThread) => void;
};

export function ThreadsSidebar(props: ThreadsSidebarProps) {
  return (
    <aside className="sidebar right-sidebar">
      <h3 className="mb-3 font-bold">Threads</h3>
      <div id="threads">
        {props.threads.length ? props.threads.map((thread) => (
          <div
            key={thread.id}
            data-scroll-thread={thread.id}
            className={`thread-card block w-full text-left ${STATUS_CLASS[thread.status]}`}
            role="button"
            tabIndex={0}
            onClick={(event) => handleThreadCardClick(event, thread, props.onScrollToThread)}
            onKeyDown={(event) => handleThreadCardKeyDown(event, thread, props.onScrollToThread)}
          >
            <ThreadHeader thread={thread} />
            <div><strong>{thread.filePath}:{thread.currentLine ?? thread.originalLine ?? "?"}</strong></div>
            <ThreadMessages thread={thread} />
            <ThreadActions {...props} thread={thread} />
          </div>
        )) : <div className="empty">No review threads.</div>}
      </div>
    </aside>
  );
}

function handleThreadCardClick(event: MouseEvent<HTMLElement>, thread: ReviewThread, onScrollToThread: (thread: ReviewThread) => void) {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("button,textarea,a,input")) return;
  onScrollToThread(thread);
}

function handleThreadCardKeyDown(event: KeyboardEvent<HTMLElement>, thread: ReviewThread, onScrollToThread: (thread: ReviewThread) => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onScrollToThread(thread);
}
