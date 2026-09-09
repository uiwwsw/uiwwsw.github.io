import { readFile, writeFile, mkdir } from "node:fs/promises";
import { load } from "cheerio";
import { createHash } from "node:crypto";
import { createServer } from "vite";
import { buildCatalog } from "../src/utils/observatory.js";
import { createHomeSnapshot } from "../src/utils/homeSnapshot.js";
import {
  SITE,
  articlePath,
  archivePath,
  pageSeo,
  structuredData,
} from "../src/utils/seo.js";
import {
  PAGE_SIZE,
  renderSeoHead,
  renderHomeFallback,
  renderArticlePage,
  renderArchivePage,
  renderSitemap,
} from "./lib/seo-pages.js";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);
const stylesheet = await readFile(new URL("reading.css", dist));
const stylePath = `/assets/reading-${createHash("sha256").update(stylesheet).digest("hex").slice(0, 12)}.css`;
await writeFile(new URL(`.${stylePath}`, dist), stylesheet);
const articles = buildCatalog(
  JSON.parse(
    await readFile(new URL("src/data/velog-context.json", root), "utf8"),
  ),
);
const paths = new Set();
for (const article of articles) {
  // A slug is exactly one filesystem segment. Fail safely instead of writing
  // outside the generated tree, overwriting an archive, or omitting a post.
  const slug = article.slug || article.id;
  if (
    !slug ||
    /[\x00-\x1f/\\]/.test(slug) ||
    [".", ".."].includes(slug) ||
    Buffer.byteLength(slug) > 240
  )
    throw new Error(`Invalid static article slug: ${slug}`);
  const path = articlePath(article);
  if (paths.has(path))
    throw new Error(`Duplicate static article path: ${path}`);
  paths.add(path);
}

const $ = load(await readFile(new URL("index.html", dist), "utf8"));
$(
  "title, meta[name='description'], meta[name='keywords'], meta[name='author'], meta[name='robots'], meta[property^='og:'], meta[property^='twitter:'], meta[name^='twitter:'], link[rel='canonical'], script[type='application/ld+json']",
).remove();
$("head").append(renderSeoHead(pageSeo(), structuredData()));
const snapshot = createHomeSnapshot(articles);
const renderer = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
try {
  const { renderHome } = await renderer.ssrLoadModule("/entry-server.jsx");
  $("#root").attr("data-prerendered", "true").html(renderHome(snapshot));
} finally {
  await renderer.close();
}
$("#initial-home").remove();
$("body").append(
  `<script id="initial-home" type="application/json">${JSON.stringify(snapshot).replace(/</g, "\\u003c")}</script>`,
);
$("noscript").remove();
// No-JS reading remains complete, but it must not flash before the live app.
$("body").append(
  `<noscript><style>#root { display: none; }</style><link rel="stylesheet" href="${stylePath}">${renderHomeFallback(articles)}</noscript>`,
);
await writeFile(new URL("index.html", dist), $.html());

async function writePage(path, html) {
  const directory = new URL(
    `.${path
      .split("/")
      .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
      .join("/")}`,
    dist,
  );
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL("index.html", directory),
    html.replaceAll('href="/reading.css"', `href="${stylePath}"`),
  );
}
for (const article of articles) {
  const related = articles
    .filter((item) => item.id !== article.id && item.topic === article.topic)
    .slice(0, 3);
  await writePage(articlePath(article), renderArticlePage(article, related));
}
const archivePages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
for (let page = 1; page <= archivePages; page++)
  await writePage(archivePath(page), renderArchivePage(articles, page));
await writeFile(new URL("sitemap.xml", dist), renderSitemap(articles));
await writeFile(
  new URL("robots.txt", dist),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
);
console.log(
  `Built SEO: ${articles.length} complete article pages, ${archivePages} archive pages, homepage, sitemap and robots.txt.`,
);
