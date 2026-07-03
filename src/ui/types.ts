export type DiffLine = {
  type: "add" | "del" | "context";
  oldNumber: number | null;
  newNumber: number | null;
  content: string;
};

export type DiffHunk = {
  header: string;
  lines: DiffLine[];
};

export type DiffFile = {
  oldPath?: string;
  newPath: string;
  status: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
};

export type DiffResponse = {
  patchsetID: string;
  files: DiffFile[];
};

export type ThreadStatus = "open" | "addressed" | "resolved" | "reopened" | "stale";
export type AuthorType = "human" | "agent" | "system";

export type ThreadMessage = {
  id: string;
  authorType: AuthorType;
  authorName?: string;
  body: string;
};

export type ReviewThread = {
  id: string;
  status: ThreadStatus;
  filePath: string;
  oldPath?: string;
  side: "old" | "new";
  originalLine?: number | null;
  currentLine?: number | null;
  messages?: ThreadMessage[];
};

export type PendingComment = {
  patchsetID: string;
  filePath: string;
  side: "old" | "new";
  line: number;
  selectedText: string[];
};

export type ThreadsResponse = {
  threads: ReviewThread[];
};

export type ThreadActionsProps = {
  replyingThreadID: string | null;
  onReplyOpen: (threadID: string) => void;
  onReplyCancel: () => void;
  onReplySend: (threadID: string, body: string) => void;
  onResolve: (threadID: string) => void;
  onReopen: (threadID: string) => void;
};
