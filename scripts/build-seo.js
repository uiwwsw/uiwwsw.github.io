import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { RIGHTS_PATH, renderRobots } from "../src/utils/contentRights.js";
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
  renderRightsPage,
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
// Start downloading the lazy 3D runtime at HTML discovery, without executing it
// before hydration. Only the homepage gets these low-priority preload hints.
const manifest = JSON.parse(
  await readFile(new URL(".vite/manifest.json", dist), "utf8"),
);
const sceneEntry = manifest["components/UniverseScene.jsx"];
if (!sceneEntry) throw new Error("Missing scene entry in the build manifest");
for (const chunk of [
  sceneEntry,
  ...(sceneEntry.imports || []).map((key) => manifest[key]),
]) {
  if (!chunk || !/\/(UniverseScene|three)-/.test(chunk.file)) continue;
  $("head").append(
    `<link rel="modulepreload" href="/${chunk.file}" crossorigin fetchpriority="low" data-scene-preload>`,
  );
}
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
await writePage(RIGHTS_PATH, renderRightsPage());
await writeFile(new URL("sitemap.xml", dist), renderSitemap(articles));
await writeFile(
  new URL("robots.txt", dist),
  renderRobots(SITE.url),
);
console.log(
  `Built SEO: ${articles.length} complete article pages, ${archivePages} archive pages, homepage, sitemap and robots.txt.`,
);

async function publicUsageRoutes(directory, prefix='') {
  const result=[];
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const path=prefix+'/'+entry.name;
    if(entry.isDirectory()) result.push(...await publicUsageRoutes(new URL(entry.name+'/',directory),path));
    else if(entry.name.endsWith('.html')) result.push(entry.name==='index.html'?path.slice(0,-'index.html'.length):path);
  }
  return result;
}
const usagePaths=['/',...articles.map(articlePath),...Array.from({length:archivePages},(_,i)=>archivePath(i+1)),RIGHTS_PATH,...await publicUsageRoutes(new URL('public/mob/',root),'/mob')];
const escapeUsagePath=path=>Array.from(path,char=>'.?+*^$[]\\(){}|'.includes(char)?'\\'+char:char).join('');
const usageConfig={service:'uiwwsw-github-io',origin:SITE.url,hosts:[new URL(SITE.url).hostname],bottom:80,routes:[...new Set(usagePaths)].map(path=>({match:path==='/'?'^/$':`^${escapeUsagePath(path.endsWith('/')?path.slice(0,-1):path)}${path.endsWith('.html')?'':'/?'}$`,path,name:path==='/'?'home':decodeURIComponent(path).split('/').filter(Boolean).join('_').slice(0,90)})),sections:{archive:'archive'},outbound:[{url:SITE.github,name:'github'},{url:SITE.velog,name:'velog'}]};
for(const name of ['article_preview','panel_archive','panel_nearby','panel_about']) usageConfig.routes.push({match:'^$',path:'/screens/'+name+'/',name});
const appServices={miripay:'qrcoin',meringuetrip:'taste-district',meyoumeyou:'manjijak',tootbeep:'tootbeep'};
for(const path of [...new Set(usagePaths)]) {
 const service=appServices[path.split('/')[2]]||usageConfig.service;
 const usageAttr=JSON.stringify({...usageConfig,service}).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
 const usageTag=`<script type="module" src="/usage-analytics.js" data-usage-config="${usageAttr}"></script>`;
 const file=new URL('.'+(path.endsWith('.html')?path:(path.endsWith('/')?path:path+'/')+'index.html'),dist);
 const usagePage=load(await readFile(file,'utf8'));
 usagePage('script[data-usage-config]').remove();
 usagePage('head').append(usageTag);
 await writeFile(file,usagePage.html());
}
