export function lineAnchorID(filePath: string, side: string, number?: number | null) {
  return `line-${domID(filePath)}-${domID(side)}-${domID(number)}`;
}

export function threadAnchorID(threadID: string) {
  return `thread-${domID(threadID)}`;
}

export function domID(value: unknown) {
  return String(value ?? "").replace(/[^A-Za-z0-9_-]/g, "_");
}
