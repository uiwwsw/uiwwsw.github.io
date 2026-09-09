# uiwwsw.github.io

A 3D writing portfolio: leave the Moon, approach Earth, and discover a real Velog article in every star. Built with React, Vite, Three.js, React Three Fiber, and drei.

## Exploring the universe

- Scroll (or swipe vertically) to travel; swipe horizontally to look around, including gestures begun over the introductory text or star labels. Touch gestures lock to the first direction to avoid accidental diagonal travel. Desktop dragging also adjusts vertical view, and horizontal trackpad scrolling pans.
- Manual travel uses small, normalized impulses instead of directly jumping the camera: a 100 px wheel event requests about 1.8% of the route; a full-height vertical touch gesture requests 30%. Normal flight is capped at 6.5% of the route per second, with a short, bounded coast. Reverse input brakes immediately; excessive trackpad momentum cannot queue the entire journey. The slider remains a direct alternative.
- Tap the compass to center the view without resetting travel. Reading a star and returning preserves the previous viewing direction. A drag does not accidentally open an article; ordinary star taps and keyboard activation still work.
- “나의 우주 유영하기” starts a slow automatic journey. Manual input stops the cruise.
- Easter egg: after reaching Earth, deliberately keep pushing to receive a hidden signal and reveal the GitHub / Velog destinations. Normal momentum is discarded at Earth; resistance increases toward the signal, and stopping gently pushes you back. Even maximal sustained effort needs about nine seconds in the resistance field, not a single hard flick. Keep scrolling/swiping, use the slider's forward arrow keys, or hold the signal button (pointer, Space or Enter). Holding uses the same rate-limited resistance, not an instant shortcut. Auto-cruise never enters it; a successful discovery stays open. Reverse travel, “다시 별들 사이로”, `Esc`, or `Home` let you leave and discover it again. The reveal is non-modal, never auto-opens an external link, and remains available without WebGL. Reduced motion disables coasting and passive pushback while retaining deliberate manual discovery.
- Select a star to read, or use “글 모아보기” to search all posts and filter by topic or code content.
- Photo-only posts are readable too. Images stay in their original order, fit the mobile reader without cropping, and link to their original size in a new tab. Only the first image loads eagerly; later images load as they approach the viewport. Each failed image has its own retry and Velog fallback.
- From a distance, topic nebulae summarize a region; select one to approach its individual stars. If several stars sit under one tap, choose from the nearby-story list.
- New writing expands into year/topic sectors of at most 96 stars. “탐험 구역” switches regions without moving existing stars; the full archive searches across every region, with year filtering and 24 stories per page.
- Keyboard: `/` opens search, `←` / `→` look around, `↑` / `PageDown` move toward Earth, `↓` / `PageUp` return toward the Moon, `Home` returns to the beginning, and `Esc` closes the current panel.
- The bottom slider offers direct, keyboard-accessible travel. Sound starts muted and is generated locally with Web Audio.
- Reduced-motion preferences disable ambient animation and animated camera transitions. The pause control stops ambient motion and automatic travel.
- Even at rest, the universe moves: procedural nebula flow, independently shimmering stars, slowly drifting foreground dust, moving cloud shadows and a faint polar atmospheric shimmer. A brief distant light trail passes about every 29 seconds after an initial quiet interval. These are artistic atmosphere effects, not a physical simulation or additional article stars.
- Atmospheric effects freeze while a panel is open or motion is paused/reduced. Hidden tabs stop both the ambient clock and canvas rendering; resuming does not fast-forward the scene. Decorative dust is one GPU point batch (360 particles on mobile / 720 on desktop); the occasional trail adds one draw only while visible. Existing article coordinates and picking targets do not move with these effects.
- The immersive reader retains the `?article=<slug>` address; old numeric article links also resolve. Search filters are shareable in the URL. Each article also has a permanent `/writing/<slug>/` reading page for search engines and sharing, with a link back to its star.
- If WebGL or an asset fails, the full searchable reading archive remains available.

## Scene and content

`src/utils/observatory.js` builds metadata from the checked-in Velog archive. Categories are inferred from titles and code content. `src/data/sky-registry.json` is an append-only record of star coordinates, numeric link aliases, and sectors. Keep it in Git: a new, reordered or removed post must not displace an existing star or reuse its old link. The original Moon–Earth route retains its 58 stars; new posts go into stable year/topic sectors, with overflow creating another sector automatically.

`UniverseScene.jsx` handles travel and the procedural background; `CelestialBodies.jsx` renders Earth's day/night/cloud/atmosphere shaders and the lunar terrain. `ArticleSky.jsx` draws the active sector in one `THREE.Points` batch, plus at most four topic nebula sprites. Nearby picking uses a capped screen-space candidate list (36 mobile / 64 desktop), checked five times a second, instead of a raycast mesh per article. Labels are capped at 3 / 5 and avoid one another, controls, and Earth. Existing readable labels keep priority over newly nearer stars, topic/article switching uses hysteresis, and retiring labels fade before their replacements appear. Stars also fade gradually near the camera and screen edges; their saved coordinates are unchanged.

`npm run prepare-content` generates a metadata-only `src/data/velog-index.json` and content-addressed `public/data/articles/*.json` bodies. Dev, test and build run it automatically. Generated files are ignored; source content and the stable registry are tracked. The reader fetches a body only when selected, cancels stale requests, offers retry on failure, and retains at most 12 bodies in memory. New or uncached bodies require a network connection; an external Velog link remains available on errors.

The scraper's `scripts/lib/article-content.js` uses Marked and Cheerio at build time to extract ordered text, code and image blocks. It does not truncate reading paragraphs, remove image-only posts, or publish raw HTML. Image blocks retain HTTPS `src` and `alt`; no credential-bearing or executable URLs are accepted. `contentVersion` invalidates older lossy extraction caches before using conditional HTTP requests. An archive containing only photos is valid; the legacy word-cloud file may then be empty. See [photo-post QA](design/photo-posts-qa.md).

Planet texture sources and attribution are documented in `public/textures/README.md` and the site's About panel. Shading references the [Three.js Earth example](https://threejs.org/examples/webgpu_tsl_earth.html), implemented in GLSL for the existing WebGL stack. No game assets are used. Distances and star positions are artistic rather than astronomical.

The landscape social thumbnail is `public/og-yoon-changwon-v2.png`, with crisp English and Korean name typography. Metadata uses an absolute, versioned image URL plus its actual dimensions and accessible alternative text. The image-edit prompt and provenance are recorded in `design/og-thumbnail.md`.

The favicon is an original code-native crescent and star: `public/favicon-moon-v3.svg`. Matching 16/32 px PNG, multi-size ICO and 180 px Apple touch assets are checked in. To regenerate them, run `scripts/generate-favicons.cjs` with `sharp` available locally (or via `NODE_PATH`); this optional design tool is not a build dependency. Versioned icon URLs replace the old full-size image preload.

## Local development

```bash
npm install
npm run dev
```

Vite will start on the port shown in the terminal (default: http://localhost:5173).

## Production build

```bash
npm test
npm run build
```

Builds the app only, using the checked-in data files already in `src/data`.

The build also generates complete static reading pages and runs `npm run check:seo` before deployment. Use `npm run preview` to check these production-only pages locally; the Vite development server is for the interactive universe.

To refresh Velog content before building:

```bash
npm run refresh-content
npm run build:app
```

Or run the full refresh + build pipeline:

```bash
npm run build:full
npm run preview
```

`npm run preview` serves the production build locally for a final check.

## Deployment

GitHub Pages deployment is automated through `.github/workflows/deploy.yml`:

- Every push to `main` (or a manual workflow dispatch) installs dependencies, runs `npm run build`, and uploads the generated `dist` folder as a Pages artifact.
- The artifact is published to the GitHub Pages environment so the site stays in sync with the latest code without committing build outputs manually.
- Because CI rebuilds and deploys automatically, the generated `dist` directory is ignored in Git and does not need to be checked in.

Monthly content refresh is handled separately by `.github/workflows/monthly-update.yml`:

- On the 1st of each month at 9:17 AM KST, the workflow refreshes Velog data, builds the site, commits refreshed JSON only when content changed, and deploys the updated Pages artifact in the same run.
- Running refresh and deployment in one workflow avoids a stale-data race between scheduled content updates and the Pages deploy job.
- Pagination continues to an empty page, without the old 1,000-post cutoff. Invalid responses, repeated/cyclic cursors and failed extraction abort before replacing archive content. Unchanged posts reuse parsed content; HTTP validators avoid downloading unchanged bodies when Velog supplies and honors them, with a source hash as the fallback. This still checks all post URLs—there is no assumed reliable update timestamp.
- The refresh commits `sky-registry.json` together with the archive and runs the same tests before deploying.

## Search visibility

`scripts/build-seo.js` runs after Vite on every build, including the monthly refresh. It generates:

- A homepage title/description identifying **윤창원 / Yoon Changwon / uiwwsw**, a frontend developer who writes. Matching visible profile copy and `Person`, `ProfilePage`, and `WebSite` structured data connect the author to the existing GitHub and Velog profiles.
- `/writing/<slug>/index.html` for every real article: the full ordered text, code and photographs are present in the HTTP response, without requiring JavaScript or WebGL. Each page includes a unique title/description, self-canonical, article social metadata, `BlogPosting` and breadcrumbs. Photo posts use their first real image; text-only posts use the portfolio thumbnail. Publication dates come from Velog; modification dates are deliberately omitted because the source does not currently provide a reliable one.
- `/writing/` and `/writing/page/<n>/` with at most 24 posts per page and crawlable pagination. The universe's article links now have real `href` destinations; normal clicks still open the immersive reader, while modified clicks and “글 전용 페이지” open the static page.
- `/sitemap.xml` containing the homepage, every archive page and every article, plus `/robots.txt` declaring the sitemap. Only preferred static URLs are listed, not search filters or alternate `?article=` views. The immersive view updates its canonical/metadata to the corresponding static page and restores the homepage metadata when closed.
- Visible homepage fallback content and recent article links when JavaScript does not run, and content-hashed reader CSS to avoid stale service-worker styles.

`npm run check:seo` verifies the final built HTML, all local links/assets, canonical metadata, structured data, sitemap coverage, and exact text/code/image block preservation. Generated pages remain in ignored `dist`; no manual page maintenance is needed when new writing arrives. Static paths reuse the Velog slug (independent of title, date and numeric IDs). Unsafe or filesystem-oversized slugs fail the build rather than silently omitting an article.

## Stable startup

The homepage is prerendered from the real `App` through `entry-server.jsx`, then hydrated in place. Its header, hero, article count, featured link and flight controls already have their final responsive layout before JavaScript runs. Only a small count/featured-title snapshot is embedded; the complete metadata catalog and article bodies stay lazy-loaded as the archive grows. An early featured-link click can use its static article URL before the catalog is ready.

The separate reading-layout fallback is restricted to `<noscript>` so it cannot flash before the universe. Its CSS is loaded only for no-JS reading; every individual SEO article page remains complete HTML. Browser media/URL state is restored after the matching initial hydration, and URL rewriting waits for restoration. The local font uses `font-display: optional` with preload to avoid a delayed font swap. The whole canvas fades in after its textures resolve and two full warm-up frames render, instead of revealing the background, Earth and Moon separately. See [startup QA](design/startup-qa.md) for verification and limitations.

### One-time owner setup

1. In [Google Search Console](https://search.google.com/search-console), add the URL-prefix property `https://uiwwsw.github.io/` and verify ownership. In [Naver Search Advisor](https://searchadvisor.naver.com/), add and verify the same site. Preserve any verification file/meta tag supplied by those services; no token or registration is fabricated by the build.
2. Submit `https://uiwwsw.github.io/sitemap.xml` to both services. You only need to submit the sitemap once; the monthly workflow keeps its contents current.
3. Inspect the homepage and a `/writing/<slug>/` page in Search Console, then request indexing if needed. Check Naver's collection/indexing status separately. Account registration and sitemap submission require the owner's authenticated access and are not performed by the GitHub workflow.

SEO makes pages discoverable; it cannot promise indexing or a rank for broad searches such as “개발자”. Because the original articles also appear on Velog, a search engine may choose the Velog original as its canonical even though the portfolio declares its own preferred URL. Original-source links remain visible, and Velog content/settings are not modified. See [the SEO QA record](design/seo-qa.md).

References: [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), and [Naver's SEO guide](https://searchadvisor.naver.com/guide/seo-basic-intro).

## Scaling verification

`npm test` covers content integrity, stable links/positions, 300/1,000/3,000-post sectors, selection bounds, loader retry/cache/cancellation, pagination safety, touch input, Korea orientation and the secret signal.

In development only, `?stress=300`, `?stress=1000`, and `?stress=3000` add clearly marked synthetic writing and a rendering counter. Combine with `&webgl=off` or `&motion=reduce` for fallback checks. These switches and synthetic articles are excluded from production builds. See [the QA record](design/scaling-qa.md) for observations and limits. If the metadata catalog itself becomes too large, the next step is year-sharded indexes; batching the scene does not eliminate metadata download costs.

`?ambient=1` shows the real sky's FPS/draw counts and ambient clock in development (without synthetic posts). Use it to verify idle motion, pause/resume and `&motion=reduce`; it is not displayed in production. See [ambient QA](design/ambient-qa.md).
