import type { Article } from "./types.js";

export function filterNewEntries(
  entries: readonly Article[],
  existingUrls: ReadonlySet<string>,
): readonly Article[] {
  return entries.filter((entry) => !existingUrls.has(entry.url));
}
