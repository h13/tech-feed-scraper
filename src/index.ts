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
