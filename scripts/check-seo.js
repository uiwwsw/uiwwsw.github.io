import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { load } from "cheerio";
import { buildCatalog } from "../src/utils/observatory.js";
import { SITE, articlePath, archivePath, pageSeo } from "../src/utils/seo.js";
import { PAGE_SIZE } from "./lib/seo-pages.js";
import { SCENE_TEXTURES } from "../src/utils/sceneStartup.js";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
const manifest = JSON.parse(
  await readFile(new URL(".vite/manifest.json", dist), "utf8"),
);
const eager = new Set();
function collectEager(key) {
  if (eager.has(key)) return;
  eager.add(key);
  for (const imported of manifest[key]?.imports || []) collectEager(imported);
}
collectEager("index.html");
assert.ok(
  ![...eager].some((key) =>
    /three|UniverseScene/.test(manifest[key]?.file || key),
  ),
  "The initial UI must not statically depend on the lazy 3D runtime",
);
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
  if (path === "/") {
    assert.equal($("#root[data-prerendered='true'] > .observatory").length, 1);
    assert.equal(
      $("#root .static-fallback").length,
      0,
      "A different reading layout must never precede the universe",
    );
    assert.equal($("#root .intro h1").length, 1);
    assert.equal($("#root .opening-sky[aria-hidden='true'] circle").length, 96);
    const criticalImages = $("head link[rel='preload'][as='image']")
      .toArray()
      .map((node) => $(node).attr("href"));
    assert.deepEqual(
      new Set(criticalImages),
      new Set([SCENE_TEXTURES.day, SCENE_TEXTURES.moon]),
    );
    const preloads = $("head link[data-scene-preload]").toArray();
    assert.equal(preloads.length, 2);
    for (const node of preloads) {
      assert.equal($(node).attr("rel"), "modulepreload");
      assert.equal($(node).attr("fetchpriority"), "low");
      await access(new URL(`.${$(node).attr("href")}`, dist));
    }
    assert.equal(
      $("#root .site-header .nav-count").text(),
      String(articles.length),
    );
    assert.equal(
      $("#root canvas").length,
      0,
      "WebGL initializes only on the client",
    );
    const initial = JSON.parse($("#initial-home").text());
    assert.equal(initial.articleCount, articles.length);
    assert.ok(!initial.articles, "The full catalog must stay lazy-loaded");
    const withoutJs = load(html, { scriptingEnabled: false });
    assert.equal(
      withoutJs("noscript .static-fallback .writing-list > li").length,
      Math.min(6, articles.length),
    );
    assert.equal(withoutJs("noscript a[href='/writing/']").length, 2);
    const fallbackStyle = withoutJs("noscript link[rel='stylesheet']").attr(
      "href",
    );
    assert.ok(fallbackStyle);
    await access(new URL(`.${fallbackStyle}`, dist));
    assert.ok(
      !$("head link[rel='stylesheet']")
        .toArray()
        .some((node) => /reading-/.test($(node).attr("href"))),
      "Reading-only CSS must not block or restyle the homepage",
    );
  }
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
