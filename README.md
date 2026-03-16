# Tech Feed Scraper

[![CI](https://github.com/h13/tech-feed-scraper/actions/workflows/ci.yml/badge.svg)](https://github.com/h13/tech-feed-scraper/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/h13/tech-feed-scraper/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4.svg)](https://developers.google.com/apps-script)

[日本語](README.ja.md)

**Automatically collect trending tech articles from Zenn and save them to Google Sheets.**

| Resource | Link |
|----------|------|
| Google Sheets | [Tech Feed Scraper](https://docs.google.com/spreadsheets/d/1m63X71qmG_D12TPgtl6Uy_2Jdi5Kkndpc4eHIDTC9RI/edit) |
| Apps Script | [Editor](https://script.google.com/d/1m947PhAkZh_TXB1IFdcT_YuHQqE_dnZfsmibzm9igE3IOsRKqy40cs9i/edit) |

A Google Apps Script application that periodically crawls [Zenn](https://zenn.dev/)'s trending RSS feed and appends new article titles and URLs to a spreadsheet — with deduplication so you never see the same article twice.

## How It Works

```
Time-driven Trigger (daily at 9:00 AM JST)
    → Read feed URLs from "Feeds" sheet
    → Fetch RSS XML via UrlFetchApp
    → Parse titles and URLs
    → Deduplicate against existing "Articles" rows
    → Append new entries
```

## Google Sheets Structure

Prepare two sheets in your spreadsheet:

### Feeds sheet

| A (URL) |
|---------|
| `https://zenn.dev/feed` |

### Articles sheet

| A (Title) | B (URL) |
|-----------|---------|
| *(auto-populated)* | *(auto-populated)* |

Row 1 is the header row in both sheets.

## Project Structure

```
tech-feed-scraper/
├── src/
│   ├── index.ts       # GAS entry point (scrape function)
│   ├── feed.ts        # RSS fetch and parse
│   ├── sheet.ts       # Deduplication logic
│   └── types.ts       # Type definitions
├── test/
│   ├── feed.test.ts   # Feed parser tests
│   └── sheet.test.ts  # Filter tests
├── appsscript.json    # GAS manifest (OAuth scopes)
├── rollup.config.mjs
├── tsconfig.json
└── jest.config.json
```

## Setup

### Prerequisites

- Node.js >= 24
- pnpm
- [clasp](https://github.com/google/clasp) (Google Apps Script CLI)

### Steps

1. **Clone and install**

   ```bash
   git clone https://github.com/h13/tech-feed-scraper.git
   cd tech-feed-scraper
   pnpm install
   ```

2. **Configure clasp**

   Create `.clasp-dev.json` and/or `.clasp-prod.json` with your Script ID:

   ```json
   { "scriptId": "YOUR_SCRIPT_ID", "rootDir": "dist" }
   ```

3. **Prepare the spreadsheet**

   - Create a Google Sheet
   - Add a sheet named **Feeds** with header `URL` in A1 and `https://zenn.dev/feed` in A2
   - Add a sheet named **Articles** with headers `Title` in A1 and `URL` in B1

4. **Deploy**

   ```bash
   pnpm run deploy       # Deploy to dev
   pnpm run deploy:prod  # Deploy to production
   ```

5. **Set up GCP project (personal Gmail accounts)**

   If `scrape` execution shows "This app is blocked", you need to link a GCP project:

   1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
   2. Go to "OAuth consent screen" → set user type to **External** → save
   3. Under "Test users", add your Gmail address
   4. In the Apps Script editor → Project Settings (gear icon) → set the GCP project number

6. **Set up trigger**

   In the Apps Script editor, run `installTrigger` to set up a daily trigger (9:00 AM JST). Or create one manually from the Triggers menu.

## Development

### Available Commands

| Command                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `pnpm run check`           | lint + lint:css + lint:html + typecheck + test  |
| `pnpm run build`           | Bundle TypeScript + copy assets to `dist/`     |
| `pnpm run deploy`          | check → build → deploy to dev                  |
| `pnpm run deploy:prod`     | check → build → deploy to production           |
| `pnpm run test -- --watch` | Jest in watch mode                             |

### Adding More Feeds

Simply add more RSS feed URLs to the **Feeds** sheet. The scraper processes all URLs listed there on each run.

## OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `script.external_request` | Fetch RSS feeds via UrlFetchApp |
| `spreadsheets` | Read/write Google Sheets |

## Built With

[Apps Script Fleet](https://github.com/h13/apps-script-fleet) — TypeScript, Rollup, Jest, clasp, GitHub Actions / GitLab CI.

## License

[MIT](LICENSE)
