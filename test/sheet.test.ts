import { filterNewEntries } from "../src/sheet.js";
import type { Article } from "../src/types.js";

describe("filterNewEntries", () => {
  it("should filter out articles whose URL already exists", () => {
    const entries: readonly Article[] = [
      { title: "New", url: "https://zenn.dev/new" },
      { title: "Existing", url: "https://zenn.dev/existing" },
    ];
    const existingUrls = new Set(["https://zenn.dev/existing"]);

    const result = filterNewEntries(entries, existingUrls);
    expect(result).toEqual([{ title: "New", url: "https://zenn.dev/new" }]);
  });

  it("should return all entries when no existing URLs", () => {
    const entries: readonly Article[] = [
      { title: "A", url: "https://zenn.dev/a" },
      { title: "B", url: "https://zenn.dev/b" },
    ];
    const result = filterNewEntries(entries, new Set());
    expect(result).toEqual(entries);
  });

  it("should return empty array when all entries exist", () => {
    const entries: readonly Article[] = [
      { title: "A", url: "https://zenn.dev/a" },
    ];
    const existingUrls = new Set(["https://zenn.dev/a"]);
    const result = filterNewEntries(entries, existingUrls);
    expect(result).toEqual([]);
  });
});
