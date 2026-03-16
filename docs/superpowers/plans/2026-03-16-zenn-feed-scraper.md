# Zenn Feed Scraper Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GAS application that crawls Zenn's trending RSS feed every 6 hours and appends new article titles and URLs to a Google Sheet.

**Architecture:** RSS feed URLs are managed in a `Feeds` sheet. A time-driven trigger calls the main function, which fetches each feed, parses entries, deduplicates against existing rows in the `Articles` sheet, and appends new entries. All business logic is in pure functions (`feed.ts`, `sheet.ts`) testable without GAS globals.

**Tech Stack:** TypeScript, Google Apps Script (V8), Rollup, Jest, clasp

---

## Chunk 1: Types, Feed Module, Sheet Module, Integration

### Task 1: Type Definitions

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create type definitions**

```typescript
export type Article = {
  readonly title: string;
  readonly url: string;
};
```

- [ ] **Step 2: Commit**

```
git add src/types.ts
git commit -m "feat: add Article type definition"
```

---

### Task 2: Feed Parser (TDD)

**Files:**
- Create: `test/feed.test.ts`
- Create: `src/feed.ts`

- [ ] **Step 1: Write the failing test for parseFeed**

```typescript
// test/feed.test.ts
import { parseFeed } from "../src/feed.js";

const VALID_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Zenn Trending</title>
    <item>
      <title>Article One</title>
      <link>https://zenn.dev/user/articles/one</link>
    </item>
    <item>
      <title>Article Two</title>
      <link>https://zenn.dev/user/articles/two</link>
    </item>
  </channel>
</rss>`;

describe("parseFeed", () => {
  it("should extract title and url from RSS XML", () => {
    const result = parseFeed(VALID_RSS);
    expect(result).toEqual([
      { title: "Article One", url: "https://zenn.dev/user/articles/one" },
      { title: "Article Two", url: "https://zenn.dev/user/articles/two" },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- test/feed.test.ts`
Expected: FAIL with "Cannot find module '../src/feed.js'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/feed.ts
import type { Article } from "./types.js";

export function parseFeed(xml: string): readonly Article[] {
  const items: Article[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;

  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1] ?? "";
    const titleMatch = titleRegex.exec(itemXml);
    const linkMatch = linkRegex.exec(itemXml);

    const title = titleMatch?.[1] ?? titleMatch?.[2] ?? "";
    const url = linkMatch?.[1] ?? "";

    if (title !== "" && url !== "") {
      items.push({ title, url });
    }
  }

  return items;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- test/feed.test.ts`
Expected: PASS

- [ ] **Step 5: Write test for empty/malformed RSS**

Add to `test/feed.test.ts`:

```typescript
  it("should return empty array for RSS with no items", () => {
    const xml = `<?xml version="1.0"?><rss><channel><title>Empty</title></channel></rss>`;
    expect(parseFeed(xml)).toEqual([]);
  });

  it("should skip items missing title or link", () => {
    const xml = `<?xml version="1.0"?>
<rss><channel>
  <item><title>No Link</title></item>
  <item><link>https://example.com</link></item>
  <item><title>Valid</title><link>https://example.com/valid</link></item>
</channel></rss>`;
    expect(parseFeed(xml)).toEqual([
      { title: "Valid", url: "https://example.com/valid" },
    ]);
  });

  it("should handle CDATA-wrapped titles", () => {
    const xml = `<?xml version="1.0"?>
<rss><channel>
  <item><title><![CDATA[CDATA Title]]></title><link>https://example.com/cdata</link></item>
</channel></rss>`;
    expect(parseFeed(xml)).toEqual([
      { title: "CDATA Title", url: "https://example.com/cdata" },
    ]);
  });
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test -- test/feed.test.ts`
Expected: PASS (all tests)

- [ ] **Step 7: Commit**

```
git add src/feed.ts test/feed.test.ts
git commit -m "feat: add RSS feed parser with tests"
```

---

### Task 3: Sheet Logic (TDD)

**Files:**
- Create: `test/sheet.test.ts`
- Create: `src/sheet.ts`

- [ ] **Step 1: Write the failing test for filterNewEntries**

```typescript
// test/sheet.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- test/sheet.test.ts`
Expected: FAIL with "Cannot find module '../src/sheet.js'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/sheet.ts
import type { Article } from "./types.js";

export function filterNewEntries(
  entries: readonly Article[],
  existingUrls: ReadonlySet<string>,
): readonly Article[] {
  return entries.filter((entry) => !existingUrls.has(entry.url));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- test/sheet.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```
git add src/sheet.ts test/sheet.test.ts
git commit -m "feat: add filterNewEntries with tests"
```

---

### Task 4: GAS Entry Point and Integration

**Files:**
- Modify: `src/index.ts`
- Modify: `appsscript.json`
- Remove: `src/greeting.ts`, `src/app.html`, `test/greeting.test.ts`

- [ ] **Step 1: Update appsscript.json with spreadsheets scope**

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
```

- [ ] **Step 2: Replace src/index.ts with entry point**

```typescript
// src/index.ts
import { parseFeed } from "./feed.js";
import { filterNewEntries } from "./sheet.js";
import type { Article } from "./types.js";

function scrape(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const feedSheet = ss.getSheetByName("Feeds");
  if (feedSheet === null) {
    Logger.log("Error: Feeds sheet not found");
    return;
  }

  const articlesSheet = ss.getSheetByName("Articles");
  if (articlesSheet === null) {
    Logger.log("Error: Articles sheet not found");
    return;
  }

  const feedUrls = feedSheet
    .getRange(2, 1, Math.max(feedSheet.getLastRow() - 1, 1), 1)
    .getValues()
    .map((row) => row[0] as string)
    .filter((url) => url !== "");

  const existingData =
    articlesSheet.getLastRow() > 1
      ? articlesSheet
          .getRange(2, 2, articlesSheet.getLastRow() - 1, 1)
          .getValues()
          .map((row) => row[0] as string)
      : [];
  const existingUrls = new Set(existingData);

  const allNewEntries: Article[] = [];

  for (const feedUrl of feedUrls) {
    try {
      const response = UrlFetchApp.fetch(feedUrl, {
        muteHttpExceptions: true,
      });
      if (response.getResponseCode() !== 200) {
        Logger.log(
          `Error fetching ${feedUrl}: HTTP ${response.getResponseCode()}`,
        );
        continue;
      }
      const xml = response.getContentText();
      const entries = parseFeed(xml);
      const newEntries = filterNewEntries(entries, existingUrls);

      for (const entry of newEntries) {
        allNewEntries.push(entry);
        existingUrls.add(entry.url);
      }
    } catch (e) {
      Logger.log(`Error processing ${feedUrl}: ${e}`);
    }
  }

  if (allNewEntries.length > 0) {
    const rows = allNewEntries.map((entry) => [entry.title, entry.url]);
    articlesSheet
      .getRange(articlesSheet.getLastRow() + 1, 1, rows.length, 2)
      .setValues(rows);
    Logger.log(`Added ${rows.length} new articles`);
  } else {
    Logger.log("No new articles found");
  }
}
```

- [ ] **Step 3: Remove sample files**

Delete `src/greeting.ts`, `src/app.html`, `test/greeting.test.ts`.

- [ ] **Step 4: Run all tests and lint**

Run: `pnpm run check`
Expected: All checks pass

- [ ] **Step 5: Commit**

```
git add -A
git commit -m "feat: add GAS entry point for feed scraping"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run full check**

Run: `pnpm run check`
Expected: lint, typecheck, test all pass

- [ ] **Step 2: Build**

Run: `pnpm run build`
Expected: `dist/` contains bundled output and `appsscript.json`

- [ ] **Step 3: Verify dist output**

Run: `ls dist/`
Expected: `index.js` and `appsscript.json`
