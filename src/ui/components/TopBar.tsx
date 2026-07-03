import type { DiffResponse } from "../types.ts";

type TopBarProps = {
  diff: DiffResponse | null;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  showResolved: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onShowResolvedChange: (next: boolean) => void;
  onRefresh: () => void;
  sseWarning: string | null;
};

export function TopBar(props: TopBarProps) {
  const summary = props.diff ? `${props.diff.files.length} files | patchset ${props.diff.patchsetID}` : "";
  return (
    <header className="topbar">
      <div>
        <strong>OpenCode Local Review</strong> <span id="summary" className="meta">{summary}</span>
      </div>
      <div className="flex items-center gap-2">
        {props.sseWarning ? <span className="meta text-[#ffd166]" title={props.sseWarning}>Live updates reconnecting</span> : null}
        <button id="toggle-left" className="button" aria-controls="files" aria-expanded={!props.leftCollapsed} onClick={props.onToggleLeft}>{props.leftCollapsed ? "Show files" : "Hide files"}</button>
        <button id="toggle-right" className="button" aria-controls="threads" aria-expanded={!props.rightCollapsed} onClick={props.onToggleRight}>{props.rightCollapsed ? "Show threads" : "Hide threads"}</button>
        <label className="meta flex items-center gap-1"><input id="show-resolved" type="checkbox" checked={props.showResolved} onChange={(event) => props.onShowResolvedChange(event.currentTarget.checked)} /> Show resolved</label>
        <button id="refresh" className="button" onClick={props.onRefresh}>Refresh diff</button>
      </div>
    </header>
  );
}
