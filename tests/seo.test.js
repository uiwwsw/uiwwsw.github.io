import test from "node:test";
import assert from "node:assert/strict";
import { load } from "cheerio";
import { readFileSync } from "node:fs";
import {
  SITE,
  articlePath,
  archivePath,
  pageSeo,
  articleImage,
  structuredData,
} from "../src/utils/seo.js";
import { buildCatalog } from "../src/utils/observatory.js";
import {
  PAGE_SIZE,
  renderArticlePage,
  renderArchivePage,
  renderHomeFallback,
  renderSitemap,
} from "../scripts/lib/seo-pages.js";

const articles = buildCatalog(
  JSON.parse(
    readFileSync(new URL("../src/data/velog-context.json", import.meta.url)),
  ),
);

test("home metadata identifies the real author and profession without keyword stuffing", () => {
  const seo = pageSeo();
  assert.match(seo.title, /윤창원.*글 쓰는 프론트엔드 개발자.*uiwwsw/);
  const graph = structuredData()["@graph"];
  const person = graph.find((node) => node["@type"] === "Person");
  assert.deepEqual(person.sameAs, [SITE.github, SITE.velog]);
  assert.equal(
    graph.find((node) => node["@type"] === "ProfilePage").mainEntity["@id"],
    person["@id"],
  );
  const $ = load(renderHomeFallback(articles));
  assert.match($("main").text(), /윤창원/);
  assert.equal($("a[href='/writing/']").length, 2);
  assert.equal($(".writing-list > li").length, Math.min(6, articles.length));
});

test("article URLs stay stable across ordering and safely encode Korean slugs", () => {
  for (const article of articles) {
    assert.equal(
      decodeURIComponent(articlePath(article)),
      `/writing/${article.slug}/`,
    );
    assert.equal(
      articlePath(article),
      articlePath({ ...article, title: "수정한 제목", legacyId: "999" }),
    );
  }
  assert.equal(
    articlePath({ slug: '사진 & "별"' }),
    "/writing/%EC%82%AC%EC%A7%84%20%26%20%22%EB%B3%84%22/",
  );
});

test("every article has complete initial HTML and its own canonical, title and BlogPosting", () => {
  for (const article of articles) {
    const $ = load(renderArticlePage(article));
    assert.equal($("h1").text(), article.title);
    assert.equal(
      $("link[rel='canonical']").attr("href"),
      `${SITE.url}${articlePath(article)}`,
    );
    assert.equal($("meta[property='og:type']").attr("content"), "article");
    assert.equal(
      $("meta[property='og:title']").attr("content"),
      $("title").text(),
    );
    assert.equal(
      $(".static-article-body").children().length,
      article.sentences.length,
    );
    assert.equal($("script[src]").length, 0);
    const post = JSON.parse($("#page-schema").text())["@graph"].find(
      (node) => node["@type"] === "BlogPosting",
    );
    assert.equal(post.author.name, "윤창원");
    assert.equal(post.datePublished, article.publishedAt);
    assert.equal(post.mainEntityOfPage, `${SITE.url}${articlePath(article)}`);
    assert.equal("dateModified" in post, false);
  }
});

test("photo-only articles retain every photo, descriptive alt and a real article social image", () => {
  const photo = articles.find((article) => article.slug === "서울역");
  const $ = load(renderArticlePage(photo));
  assert.equal($(".static-article-body img").length, 6);
  assert.equal($(".static-article-body img[loading='eager']").length, 1);
  assert.equal(
    $("meta[property='og:image']").attr("content"),
    photo.sentences[0].src,
  );
  assert.equal($("meta[property='og:image:width']").length, 0);
  assert.equal(
    $(".static-article-body img").last().attr("alt"),
    "서울역 · 사진 6",
  );
  assert.deepEqual(
    articleImage({ seoImage: articleImage(photo) }),
    articleImage(photo),
  );
});

test("HTML, attributes, code and JSON-LD cannot execute scraped content", () => {
  const text =
    '</script><script>alert("x")</script> & <img onerror="alert(1)">';
  const sample = {
    id: "safe",
    slug: "safe",
    title: text,
    summary: text,
    link: SITE.velog,
    topic: "essay",
    readingTime: 1,
    sentences: [
      { type: "text", fullSentence: text },
      { type: "code", language: 'js" onload="evil', fullSentence: text },
      { type: "image", src: "https://example.com/photo.png", alt: text },
    ],
  };
  const $ = load(renderArticlePage(sample));
  assert.equal($("script").length, 1);
  assert.equal($("[onerror], [onload]").length, 0);
  assert.equal($(".static-article-body > p").text(), text);
  assert.equal($(".static-article-body code").text(), text);
  assert.equal($("img").attr("alt"), text);
  assert.equal($("title").text(), pageSeo(sample).title);
  assert.equal(
    JSON.parse($("#page-schema").text())["@graph"][2].headline,
    text,
  );
});

test("paginated static archives and sitemap expose every article exactly once", () => {
  const paths = new Set();
  const pages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  for (let page = 1; page <= pages; page++) {
    const $ = load(renderArchivePage(articles, page));
    assert.equal(
      $("link[rel='canonical']").attr("href"),
      `${SITE.url}${archivePath(page)}`,
    );
    const links = $(".writing-list h2 a");
    assert.ok(links.length <= PAGE_SIZE);
    for (const node of links.toArray()) {
      const href = $(node).attr("href");
      assert.ok(!paths.has(href));
      paths.add(href);
    }
    if (page < pages)
      assert.equal($("a[rel='next']").attr("href"), archivePath(page + 1));
    if (page > 1)
      assert.equal($("a[rel='prev']").attr("href"), archivePath(page - 1));
  }
  assert.deepEqual(paths, new Set(articles.map(articlePath)));
  const $ = load(renderSitemap(articles), { xmlMode: true });
  assert.equal($("loc").length, articles.length + pages + 1);
  assert.equal($("lastmod").length, 0);
});

test("empty archives and growing archives still have bounded, navigable HTML", () => {
  assert.equal(load(renderArchivePage([]))("h1").length, 1);
  const many = Array.from({ length: 3000 }, (_, i) => ({
    ...articles[0],
    id: `post-${i}`,
    slug: `post-${i}`,
  }));
  const $ = load(renderArchivePage(many, 125));
  assert.equal($(".writing-list > li").length, PAGE_SIZE);
  assert.equal($("a[rel='next']").length, 0);
  assert.equal($("a[rel='prev']").attr("href"), archivePath(124));
});
