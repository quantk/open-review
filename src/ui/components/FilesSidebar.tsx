import type { DiffResponse } from "../types.ts";

type FilesSidebarProps = {
  diff: DiffResponse | null;
  currentFile: string | null;
  onSelectFile: (filePath: string) => void;
};

export function FilesSidebar(props: FilesSidebarProps) {
  return (
    <aside className="sidebar left-sidebar">
      <h3 className="mb-3 font-bold">Files</h3>
      <div id="files">
        {props.diff?.files.length ? props.diff.files.map((file) => (
          <button key={file.newPath} className={`file-card block w-full text-left ${file.newPath === props.currentFile ? "active" : ""}`} onClick={() => props.onSelectFile(file.newPath)}>
            <div>{file.newPath}</div>
            <div className="meta">+{file.additions} -{file.deletions} | {file.status}</div>
          </button>
        )) : <div className="empty">No diff</div>}
      </div>
    </aside>
  );
}
