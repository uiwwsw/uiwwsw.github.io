import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { load } from "cheerio";
import { buildCatalog } from "../src/utils/observatory.js";
import { SITE, articlePath, archivePath, pageSeo } from "../src/utils/seo.js";
import { PAGE_SIZE } from "./lib/seo-pages.js";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
const articles = buildCatalog(
  JSON.parse(
    await readFile(new URL("src/data/velog-context.json", root), "utf8"),
  ),
);
const pages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
const expectedPaths = [
  "/",
  ...Array.from({ length: pages }, (_, i) => archivePath(i + 1)),
  ...articles.map(articlePath),
];
const sitemap = load(await readFile(new URL("sitemap.xml", dist), "utf8"), {
  xmlMode: true,
});
const locations = sitemap("url > loc")
  .toArray()
  .map((node) => sitemap(node).text());
assert.equal(new Set(locations).size, expectedPaths.length);
assert.deepEqual(
  new Set(locations),
  new Set(expectedPaths.map((path) => `${SITE.url}${path}`)),
);
assert.match(
  await readFile(new URL("robots.txt", dist), "utf8"),
  /Sitemap: https:\/\/uiwwsw\.github\.io\/sitemap\.xml/,
);
const linkedArticles = new Set();
let photos = 0;
for (const path of expectedPaths) {
  const html = await readFile(new URL(`.${path}index.html`, dist), "utf8");
  const $ = load(html);
  assert.equal($("html").attr("lang"), "ko", path);
  assert.equal($("title").length, 1, path);
  assert.equal($("meta[name='description']").length, 1, path);
  assert.equal($("link[rel='canonical']").length, 1, path);
  assert.equal($("link[rel='canonical']").attr("href"), `${SITE.url}${path}`);
  assert.equal(
    $("meta[property='og:url']").attr("content"),
    `${SITE.url}${path}`,
  );
  assert.equal($("h1").length, 1, path);
  assert.ok(!/noindex/i.test($("meta[name='robots']").attr("content")), path);
  assert.ok(!html.includes("__SW_VERSION__"), path);
  JSON.parse($("#page-schema").text());
  for (const node of $("a[href^='/']").toArray()) {
    const href = $(node).attr("href");
    const local = new URL(href, SITE.url);
    await access(
      new URL(
        `.${local.pathname}${local.pathname.endsWith("/") ? "index.html" : ""}`,
        dist,
      ),
    );
    if (path.startsWith("/writing/") && !$(".static-article-body").length)
      linkedArticles.add(local.pathname);
  }
  for (const node of $("link[rel='stylesheet'], script[src]").toArray()) {
    const asset = $(node).attr("href") || $(node).attr("src");
    const url = new URL(asset, `${SITE.url}${path}`);
    if (url.origin === SITE.url)
      await access(new URL(`.${url.pathname}`, dist));
  }
  const article = articles.find((item) => articlePath(item) === path);
  if (article) {
    assert.equal($("title").text(), pageSeo(article).title);
    assert.equal($("h1").text(), article.title);
    assert.equal(
      $("script[src], script[type='module']").length,
      0,
      "Static reading must work without JavaScript or WebGL",
    );
    const graph = JSON.parse($("#page-schema").text())["@graph"];
    const posting = graph.find((node) => node["@type"] === "BlogPosting");
    assert.equal(posting.headline, article.title);
    assert.equal(posting.author.name, "윤창원");
    assert.equal(posting.datePublished, article.publishedAt || undefined);
    assert.ok(!("dateModified" in posting), "Never invent a modification date");
    const blocks = $(".static-article-body").children().toArray();
    assert.equal(blocks.length, article.sentences.length, path);
    blocks.forEach((node, i) => {
      const original = article.sentences[i];
      if (original.type === "image") {
        photos++;
        assert.equal($(node).find("img").attr("src"), original.src);
        assert.ok($(node).find("img").attr("alt"));
      } else assert.equal($(node).text(), original.fullSentence);
    });
  } else if (path.startsWith("/writing/"))
    assert.ok($(".writing-list > li").length <= PAGE_SIZE);
}
for (const article of articles)
  assert.ok(
    linkedArticles.has(articlePath(article)),
    `Orphan article: ${article.slug}`,
  );
console.log(
  `SEO verified: ${expectedPaths.length} indexable HTML pages, all ${articles.length} complete articles, ${photos} photos, crawlable internal links, canonical metadata, JSON-LD and sitemap.`,
);
