import { useState } from "react";
import type { PendingComment } from "../types.ts";

type CommentComposerProps = {
  pending: PendingComment;
  onCancel: () => void;
  onSubmit: (input: PendingComment, message: string) => void;
};

export function CommentComposer(props: CommentComposerProps) {
  const [message, setMessage] = useState("");
  return (
    <div className="composer">
      <div className="meta">New comment on {props.pending.filePath}:{props.pending.line}</div>
      <textarea className="text-input" id="comment" placeholder="Write review comment..." autoFocus value={message} onChange={(event) => setMessage(event.currentTarget.value)} />
      <p className="mt-2 flex gap-2">
        <button id="save-comment" className="button" onClick={() => message.trim() && props.onSubmit(props.pending, message.trim())}>Add comment</button>
        <button id="cancel-comment" className="button" onClick={props.onCancel}>Cancel</button>
      </p>
    </div>
  );
}
