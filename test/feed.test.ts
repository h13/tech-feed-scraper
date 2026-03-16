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
});
