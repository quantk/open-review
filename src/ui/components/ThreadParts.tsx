import { useState } from "react";
import { AUTHOR_CLASS, BADGE_CLASS, STATUS_CLASS } from "../classes.ts";
import { threadAnchorID } from "../dom.ts";
import type { ReviewThread, ThreadActionsProps, ThreadMessage } from "../types.ts";

export function InlineThread(props: ThreadActionsProps & { thread: ReviewThread }) {
  return (
    <div id={threadAnchorID(props.thread.id)} data-inline-thread={props.thread.id} className={`inline-thread thread-anchor ${STATUS_CLASS[props.thread.status]}`}>
      <ThreadHeader thread={props.thread} showID />
      <ThreadMessages thread={props.thread} />
      <ThreadActions {...props} />
    </div>
  );
}

export function ThreadHeader(props: { thread: ReviewThread; showID?: boolean }) {
  return <div><span className={`badge ${BADGE_CLASS[props.thread.status]}`}>{props.thread.status}</span>{props.showID ? <span className="meta ml-2">{props.thread.id}</span> : null}</div>;
}

export function ThreadMessages(props: { thread: ReviewThread }) {
  return <>{(props.thread.messages || []).map((message) => <div key={message.id} className={`message ${AUTHOR_CLASS[message.authorType] || AUTHOR_CLASS.human}`}><span className="message-label">{messageLabel(message)}</span>{message.body}</div>)}</>;
}

export function ThreadActions(props: ThreadActionsProps & { thread: ReviewThread }) {
  return (
    <div className="mt-2">
      {props.replyingThreadID === props.thread.id ? <ReplyComposer threadID={props.thread.id} onCancel={props.onReplyCancel} onSubmit={props.onReplySend} /> : null}
      <p className="flex gap-2">
        <button className="button" type="button" onClick={() => props.onReplyOpen(props.thread.id)}>Reply</button>
        {props.thread.status === "resolved" ? <button className="button" type="button" onClick={() => props.onReopen(props.thread.id)}>Reopen</button> : <button className="button" type="button" onClick={() => props.onResolve(props.thread.id)}>Resolve</button>}
      </p>
    </div>
  );
}

function ReplyComposer(props: { threadID: string; onCancel: () => void; onSubmit: (threadID: string, body: string) => void }) {
  const [body, setBody] = useState("");
  return (
    <div className="mb-2">
      <textarea className="text-input" data-reply-body={props.threadID} placeholder="Reply in this thread..." autoFocus value={body} onChange={(event) => setBody(event.currentTarget.value)} />
      <p className="mt-2 flex gap-2">
        <button className="button" type="button" onClick={() => body.trim() && props.onSubmit(props.threadID, body.trim())}>Send reply</button>
        <button className="button" type="button" onClick={props.onCancel}>Cancel</button>
      </p>
    </div>
  );
}

function messageLabel(message: ThreadMessage) {
  return message.authorType === "agent" ? "Agent" : message.authorType === "system" ? "System" : "You";
}
