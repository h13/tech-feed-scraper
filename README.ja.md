# Tech Feed Scraper

[![CI](https://github.com/h13/tech-feed-scraper/actions/workflows/ci.yml/badge.svg)](https://github.com/h13/tech-feed-scraper/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/h13/tech-feed-scraper/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4.svg)](https://developers.google.com/apps-script)

[English](README.md)

**Zenn のトレンド記事を自動収集して Google Sheets に保存。**

[Zenn](https://zenn.dev/) のトレンド RSS フィードを定期的にクロールし、記事のタイトルと URL をスプレッドシートに追記する Google Apps Script アプリケーションです。重複チェック付きで、同じ記事が二度記録されることはありません。

## 仕組み

```
時限トリガー（6時間ごと）
    → "Feeds" シートからフィード URL を読み取り
    → UrlFetchApp で RSS XML を取得
    → タイトルと URL をパース
    → "Articles" シートの既存行と重複チェック
    → 新規エントリを追記
```

## Google Sheets の構成

スプレッドシートに2つのシートを用意します：

### Feeds シート

| A (URL) |
|---------|
| `https://zenn.dev/feed` |

### Articles シート

| A (Title) | B (URL) |
|-----------|---------|
| *(自動入力)* | *(自動入力)* |

両シートとも1行目はヘッダーです。

## プロジェクト構成

```
tech-feed-scraper/
├── src/
│   ├── index.ts       # GAS エントリポイント（scrape 関数）
│   ├── feed.ts        # RSS 取得・パース
│   ├── sheet.ts       # 重複チェックロジック
│   └── types.ts       # 型定義
├── test/
│   ├── feed.test.ts   # フィードパーサーのテスト
│   └── sheet.test.ts  # フィルターのテスト
├── appsscript.json    # GAS マニフェスト（OAuth スコープ）
├── rollup.config.mjs
├── tsconfig.json
└── jest.config.json
```

## セットアップ

### 前提条件

- Node.js >= 24
- pnpm
- [clasp](https://github.com/google/clasp)（Google Apps Script CLI）

### 手順

1. **クローンとインストール**

   ```bash
   git clone https://github.com/h13/tech-feed-scraper.git
   cd tech-feed-scraper
   pnpm install
   ```

2. **clasp の設定**

   `.clasp-dev.json` および `.clasp-prod.json` を作成し、Script ID を設定：

   ```json
   { "scriptId": "YOUR_SCRIPT_ID", "rootDir": "dist" }
   ```

3. **スプレッドシートの準備**

   - Google Sheets を作成
   - **Feeds** シートを追加：A1 に `URL`（ヘッダー）、A2 に `https://zenn.dev/feed`
   - **Articles** シートを追加：A1 に `Title`、B1 に `URL`（ヘッダー）

4. **デプロイ**

   ```bash
   pnpm run deploy       # dev にデプロイ
   pnpm run deploy:prod  # 本番にデプロイ
   ```

5. **トリガーの設定**

   Apps Script エディタで `scrape` 関数に6時間ごとの時限トリガーを作成します。

## 開発

### 利用可能なコマンド

| コマンド                   | 説明                                          |
| -------------------------- | --------------------------------------------- |
| `pnpm run check`           | lint + lint:css + lint:html + 型チェック + テスト |
| `pnpm run build`           | TypeScript をバンドル + アセットを `dist/` にコピー |
| `pnpm run deploy`          | check → build → dev にデプロイ                |
| `pnpm run deploy:prod`     | check → build → 本番にデプロイ                |
| `pnpm run test -- --watch` | Jest のウォッチモード                         |

### フィードの追加

**Feeds** シートに RSS フィード URL を追加するだけで、スクレイパーは毎回すべての URL を処理します。

## OAuth スコープ

| スコープ | 用途 |
|----------|------|
| `script.external_request` | UrlFetchApp で RSS フィードを取得 |
| `spreadsheets` | Google Sheets の読み書き |

## 構築基盤

[Apps Script Fleet](https://github.com/h13/apps-script-fleet) — TypeScript, Rollup, Jest, clasp, GitHub Actions / GitLab CI。

## ライセンス

[MIT](LICENSE)
