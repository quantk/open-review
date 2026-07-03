import { Fragment } from "react";
import { lineAnchorID } from "../dom.ts";
import { highlightCode, linePrefix } from "../highlighter.tsx";
import type { DiffFile, DiffLine, DiffResponse, PendingComment, ReviewThread, ThreadActionsProps } from "../types.ts";
import { CommentComposer } from "./CommentComposer.tsx";
import { InlineThread } from "./ThreadParts.tsx";

type DiffViewProps = ThreadActionsProps & {
  diff: DiffResponse | null;
  currentFile: string | null;
  pending: PendingComment | null;
  visibleThreads: ReviewThread[];
  error: string | null;
  onOpenComposer: (input: PendingComment) => void;
  onCancelComposer: () => void;
  onCreateThread: (input: PendingComment, message: string) => void;
};

export function DiffView(props: DiffViewProps) {
  if (props.error) return <main id="diff" className="diff-pane"><div className="empty">{props.error}</div></main>;
  if (!props.diff) return <main id="diff" className="diff-pane"><div className="empty">Loading review...</div></main>;

  const files = props.currentFile ? props.diff.files.filter((file) => file.newPath === props.currentFile) : props.diff.files;
  return (
    <main id="diff" className="diff-pane">
      {files.length ? files.map((file) => (
        <section key={file.newPath} className="diff-file">
          <div className="file-title">{file.newPath}</div>
          {file.hunks.map((hunk) => (
            <table key={hunk.header} className="diff-table">
              <tbody>
                <tr className="hunk-row"><td className="num-cell" /><td className="num-cell" /><td className="comment-cell" /><td className="code-cell">{hunk.header}</td></tr>
                {hunk.lines.map((line) => (
                  <DiffLineRow
                    key={`${line.oldNumber ?? ""}:${line.newNumber ?? ""}:${line.type}:${line.content}`}
                    diff={props.diff!}
                    file={file}
                    line={line}
                    pending={props.pending}
                    threads={props.visibleThreads}
                    replyingThreadID={props.replyingThreadID}
                    onOpenComposer={props.onOpenComposer}
                    onCancelComposer={props.onCancelComposer}
                    onCreateThread={props.onCreateThread}
                    onReplyOpen={props.onReplyOpen}
                    onReplyCancel={props.onReplyCancel}
                    onReplySend={props.onReplySend}
                    onResolve={props.onResolve}
                    onReopen={props.onReopen}
                  />
                ))}
              </tbody>
            </table>
          ))}
        </section>
      )) : <div className="empty">No changes for selected file. Use Refresh diff or select a file from the left panel.</div>}
    </main>
  );
}

type DiffLineRowProps = ThreadActionsProps & {
  diff: DiffResponse;
  file: DiffFile;
  line: DiffLine;
  pending: PendingComment | null;
  threads: ReviewThread[];
  onOpenComposer: (input: PendingComment) => void;
  onCancelComposer: () => void;
  onCreateThread: (input: PendingComment, message: string) => void;
};

function DiffLineRow(props: DiffLineRowProps) {
  const side: PendingComment["side"] = props.line.newNumber == null ? "old" : "new";
  const number = side === "new" ? props.line.newNumber : props.line.oldNumber;
  const rowID = number ? lineAnchorID(props.file.newPath, side, number) : undefined;
  const rowClassName = ["line-anchor", props.line.type === "add" ? "line-add" : props.line.type === "del" ? "line-del" : ""].filter(Boolean).join(" ");
  const matchingThreads = number == null ? [] : props.threads.filter((thread) => (thread.filePath === props.file.newPath || thread.filePath === props.file.oldPath) && thread.side === side && (thread.currentLine ?? thread.originalLine) === number);
  const pendingHere = props.pending && number != null && props.pending.filePath === props.file.newPath && props.pending.side === side && props.pending.line === number;
  const commentPayload = number == null ? null : { patchsetID: props.diff.patchsetID, filePath: props.file.newPath, side, line: number, selectedText: [props.line.content] };

  return (
    <Fragment>
      <tr id={rowID} className={rowClassName}>
        <td className="num-cell">{props.line.oldNumber ?? ""}</td>
        <td className="num-cell">{props.line.newNumber ?? ""}</td>
        <td className="comment-cell">{commentPayload ? <button className="button plus-button" data-comment="true" onClick={() => props.onOpenComposer(commentPayload)}>+</button> : null}</td>
        <td className="code-cell"><span className="meta">{linePrefix(props.line.type)}</span>{highlightCode(props.line.content, props.file.newPath)}</td>
      </tr>
      {pendingHere ? <tr><td /><td /><td /><td className="composer-cell"><CommentComposer pending={props.pending!} onCancel={props.onCancelComposer} onSubmit={props.onCreateThread} /></td></tr> : null}
      {matchingThreads.length ? (
        <tr className="inline-thread-row"><td /><td /><td /><td className="inline-thread-cell">{matchingThreads.map((thread) => (
          <InlineThread
            key={thread.id}
            thread={thread}
            replyingThreadID={props.replyingThreadID}
            onReplyOpen={props.onReplyOpen}
            onReplyCancel={props.onReplyCancel}
            onReplySend={props.onReplySend}
            onResolve={props.onResolve}
            onReopen={props.onReopen}
          />
        ))}</td></tr>
      ) : null}
    </Fragment>
  );
}
