import type { Article } from "./types.js";

export function parseFeed(xml: string): readonly Article[] {
  const items: Article[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex =
    /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
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
