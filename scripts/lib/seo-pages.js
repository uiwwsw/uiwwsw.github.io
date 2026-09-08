import {
  SITE,
  AUTHOR,
  articlePath,
  archivePath,
  pageSeo,
  structuredData,
} from "../../src/utils/seo.js";
import { imageSource } from "../../src/utils/articleMedia.js";
import { TOPICS, formatDate } from "../../src/utils/observatory.js";

export const PAGE_SIZE = 24;
export const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
export const jsonLd = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

export function renderSeoHead(seo, schema) {
  const tag = (attribute, name, content) =>
    `<meta ${attribute}="${name}" content="${escapeHtml(content)}">`;
  return `<title>${escapeHtml(seo.title)}</title>
${tag("name", "description", seo.description)}
${tag("name", "author", AUTHOR.name)}
${tag("name", "robots", "index, follow, max-image-preview:large")}
<link rel="canonical" href="${escapeHtml(seo.url)}">
${tag("property", "og:locale", "ko_KR")}
${tag("property", "og:site_name", SITE.name)}
${tag("property", "og:type", seo.type)}
${["og", "twitter"]
  .map((prefix) =>
    [
      tag("property", `${prefix}:title`, seo.title),
      tag("property", `${prefix}:description`, seo.description),
      tag("property", `${prefix}:url`, seo.url),
      tag("property", `${prefix}:image`, seo.image.src),
    ].join("\n"),
  )
  .join("\n")}
${tag("property", "og:image:alt", seo.image.alt)}
${tag("name", "twitter:image:alt", seo.image.alt)}
${tag("property", "twitter:card", "summary_large_image")}
${seo.image.src === SITE.image ? [tag("property", "og:image:type", "image/png"), tag("property", "og:image:width", "1738"), tag("property", "og:image:height", "905")].join("\n") : ""}
${seo.publishedAt ? tag("property", "article:published_time", seo.publishedAt) : ""}
${seo.type === "article" ? tag("property", "article:author", AUTHOR.url) : ""}
<script id="page-schema" type="application/ld+json">${jsonLd(schema)}</script>`;
}

const navigation = `<header class="reading-site-header"><a class="reading-brand" href="/">윤창원<span>uiwwsw · 작은 우주</span></a><nav aria-label="메인 메뉴"><a href="/">우주 탐험 ↗</a><a href="/writing/">모든 글</a></nav></header>`;
const footer = `<footer class="reading-site-footer"><p>코드를 쓰고, 생각을 씁니다.<br>글 쓰는 프론트엔드 개발자 윤창원.</p><nav aria-label="작가의 다른 공간"><a href="${SITE.github}">GitHub ↗</a><a href="${SITE.velog}">Velog ↗</a><a href="/">작은 우주로 ↗</a></nav></footer>`;

function documentPage(seo, schema, content) {
  return `<!doctype html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#03060c">
${renderSeoHead(seo, schema)}
<link rel="icon" href="/favicon.ico?v=3" sizes="any"><link rel="icon" href="/favicon-moon-v3.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-moon-v3.png">
<link rel="stylesheet" href="/reading.css">
</head><body class="reading-site"><a class="reading-skip" href="#content">본문으로 바로가기</a>${navigation}<main id="content" class="reading-content">${content}</main>${footer}</body></html>`;
}

function dateMarkup(article) {
  return article.publishedAt
    ? `<time datetime="${escapeHtml(article.publishedAt)}">${escapeHtml(formatDate(article.publishedAt))}</time>`
    : "";
}

export function renderBlocks(article) {
  let photos = 0;
  return article.sentences
    .map((block) => {
      if (block.type === "image") {
        const src = imageSource(block.src);
        if (!src) throw new Error(`Invalid image in ${article.slug}`);
        const number = ++photos;
        const alt = block.alt?.trim() || `${article.title} · 사진 ${number}`;
        return `<figure class="reading-photo"><a href="${escapeHtml(src)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(alt)} 크게 보기 (새 탭)"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="${number === 1 ? "eager" : "lazy"}" decoding="async" referrerpolicy="no-referrer"></a><figcaption>${escapeHtml(alt)} <a href="${escapeHtml(src)}" target="_blank" rel="noreferrer">원본 크게 보기 ↗</a></figcaption></figure>`;
      }
      if (block.type === "code")
        return `<pre><code${block.language ? ` class="language-${escapeHtml(block.language)}"` : ""}>${escapeHtml(block.fullSentence)}</code></pre>`;
      return `<p>${escapeHtml(block.fullSentence)}</p>`;
    })
    .join("\n");
}

export function articleCards(articles) {
  return `<ol class="writing-list">${articles.map((article) => `<li><article><p class="reading-eyebrow">${escapeHtml(TOPICS[article.topic]?.label || "기록")} · ${dateMarkup(article)}</p><h2><a href="${articlePath(article)}">${escapeHtml(article.title)}</a></h2><p class="writing-summary">${escapeHtml(article.summary)}</p></article></li>`).join("\n")}</ol>`;
}

export function renderArticlePage(article, related = []) {
  const seo = pageSeo(article);
  const schema = structuredData(article);
  schema["@graph"].push({
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "윤창원",
        item: `${SITE.url}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "모든 글",
        item: `${SITE.url}/writing/`,
      },
      { "@type": "ListItem", position: 3, name: article.title, item: seo.url },
    ],
  });
  return documentPage(
    seo,
    schema,
    `<nav class="reading-breadcrumb" aria-label="현재 위치"><a href="/">작은 우주</a> / <a href="/writing/">모든 글</a> / <span>${escapeHtml(TOPICS[article.topic]?.label || "기록")}</span></nav>
<article><header class="writing-heading"><p class="reading-eyebrow">${escapeHtml(TOPICS[article.topic]?.label || "기록")}</p><h1>${escapeHtml(article.title)}</h1><p class="writing-byline"><a href="/">윤창원 · 프론트엔드 개발자</a>${dateMarkup(article)}<span>${article.readingTime}분 읽기</span></p></header>
<nav class="writing-actions" aria-label="이 글 읽기"><a href="/?article=${encodeURIComponent(article.id)}">우주에서 이 별 만나기 ↗</a><a href="${escapeHtml(article.link)}" target="_blank" rel="noreferrer">벨로그 원문 ↗</a></nav>
<div class="static-article-body">${renderBlocks(article)}</div>
<p class="writing-source">윤창원이 벨로그에 남긴 글을 이 작은 우주에도 모았습니다. 사진은 누르면 원본 크기로 볼 수 있습니다. <a href="${escapeHtml(article.link)}">원문의 전체 서식 보기 ↗</a></p></article>
${related.length ? `<section class="related-writing" aria-labelledby="related-title"><p class="reading-eyebrow">ANOTHER STAR, ANOTHER STORY</p><h2 id="related-title">이어서 읽는 기록</h2>${articleCards(related)}</section>` : ""}
<a class="writing-all-link" href="/writing/">모든 글 둘러보기 →</a>`,
  );
}

export function renderArchivePage(articles, page = 1) {
  const pages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const slice = articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const seo = {
    ...pageSeo(),
    title: `글 모아보기${page > 1 ? ` · ${page}페이지` : ""} | 윤창원 · 글 쓰는 프론트엔드 개발자`,
    description: `윤창원의 개발 기록, 프로젝트 회고, 일상 에세이와 사진 ${articles.length}편. ${page}/${pages}페이지에서 저마다 빛나는 이야기를 읽어보세요.`,
    url: `${SITE.url}${archivePath(page)}`,
  };
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seo.title,
    url: seo.url,
    description: seo.description,
    inLanguage: "ko-KR",
    author: AUTHOR,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: slice.map((article, i) => ({
        "@type": "ListItem",
        position: (page - 1) * PAGE_SIZE + i + 1,
        name: article.title,
        url: `${SITE.url}${articlePath(article)}`,
      })),
    },
  };
  return documentPage(
    seo,
    schema,
    `<header class="writing-heading"><p class="reading-eyebrow">THE WRITING ARCHIVE</p><h1>저마다 빛나는 이야기</h1><p class="writing-introduction">프론트엔드 개발자 윤창원의 기술과 프로젝트, 일상과 마음에 관한 기록.<br>하나의 글, 하나의 별. 마음이 닿는 이야기부터 읽어 보세요.</p><p class="writing-count">${articles.length}개의 기록 · ${page} / ${pages}페이지</p></header>
${articleCards(slice)}
<nav class="writing-pagination" aria-label="글 목록 페이지">${page > 1 ? `<a rel="prev" href="${archivePath(page - 1)}">← 이전</a>` : "<span></span>"}<span>${page} / ${pages}</span>${page < pages ? `<a rel="next" href="${archivePath(page + 1)}">다음 →</a>` : "<span></span>"}</nav>`,
  );
}

export function renderHomeFallback(articles) {
  return `<div class="static-fallback reading-site">${navigation}<main class="reading-content"><header class="writing-heading"><p class="reading-eyebrow">A LITTLE SPACE FOR MY THOUGHTS</p><h1>기록은 별이 되고,<br>생각은 우주가 된다.</h1><p class="writing-introduction">글 쓰는 프론트엔드 개발자 윤창원입니다.<br>코드를 쓰고, 생각을 씁니다.</p><p>${escapeHtml(SITE.description)}</p></header><a class="writing-all-link" href="/writing/">글 ${articles.length}편 모두 읽기 →</a><section aria-labelledby="latest-title"><h2 id="latest-title">최근에 띄운 기록</h2>${articleCards(articles.slice(0, 6))}</section></main>${footer}</div>`;
}

export function renderSitemap(articles) {
  const paths = [
    "/",
    ...Array.from(
      { length: Math.max(1, Math.ceil(articles.length / PAGE_SIZE)) },
      (_, i) => archivePath(i + 1),
    ),
    ...articles.map(articlePath),
  ];
  // No fabricated modification times: the source currently has publication dates only.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `<url><loc>${escapeHtml(`${SITE.url}${path}`)}</loc></url>`).join("\n")}\n</urlset>\n`;
}
