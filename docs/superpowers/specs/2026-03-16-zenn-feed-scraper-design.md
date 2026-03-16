# Zenn Feed Scraper Design

## Overview

Zenn trending RSS feed (`https://zenn.dev/feed`) を6時間ごとにクロールし、title と URL を Google Sheets に追記する GAS アプリケーション。

## Architecture

```
[GAS Time-driven Trigger (6h)]
    → fetchFeed(): UrlFetchApp で RSS 取得
    → parseFeed(): XML パース → {title, url}[] に変換
    → getExistingUrls(): シートから既存 URL を Set で取得
    → filterNewEntries(): 重複除外
    → appendEntries(): 新規記事をシートに追記
```

## Google Sheets Structure

| Sheet Name | Purpose |
|------------|---------|
| `Feeds` | Feed URL management (Column A: URL) |
| `Articles` | Article accumulation (Column A: Title, Column B: URL) |

`Feeds` sheet contains `https://zenn.dev/feed` as initial value.

## Module Structure

| File | Responsibility |
|------|---------------|
| `src/index.ts` | GAS entry point (trigger handler) |
| `src/feed.ts` | RSS fetch and parse |
| `src/sheet.ts` | Sheets read/write (get existing URLs, append) |
| `src/types.ts` | Type definitions |

## OAuth Scopes

- `https://www.googleapis.com/auth/script.external_request` (existing)
- `https://www.googleapis.com/auth/spreadsheets` (new)

## Error Handling

- Feed fetch failure: `Logger.log` error, skip processing
- Parse failure: skip invalid entries with log

## Data Flow

1. Read feed URLs from `Feeds` sheet
2. For each feed URL: fetch RSS XML via `UrlFetchApp.fetch()`
3. Parse XML using `XmlService.parse()` to extract title and link
4. Read existing URLs from `Articles` sheet into a `Set<string>`
5. Filter out entries whose URL already exists
6. Append new entries to `Articles` sheet

## Constraints

- GAS runtime (V8), no npm packages available at runtime
- `UrlFetchApp` for HTTP requests
- `XmlService` for XML parsing
- `SpreadsheetApp` for Sheets access
- All source identifiers and sheet names in English
