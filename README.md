# uiwwsw.github.io

A 3D writing portfolio: leave the Moon, approach Earth, and discover a real Velog article in every star. Built with React, Vite, Three.js, React Three Fiber, and drei.

## Exploring the universe

- **Same universe, a different night:** each new page visit or reload chooses a fresh local seed. More than 95% of decorative background stars change, along with dust flow and the single meteor's timing/direction. The 96 bright anchors in each first-HTML layout stay fixed for the existing seamless sky handoff. Article stars wander up to 3.2 world units around their saved coordinates, within their sector and with neighbor/Earth clearance checks; IDs, links, chronological order and the append-only registry do not change. Reading, filtering, sector changes and returning home retain that visit; browser history-back restores it when history state is available. No cookie, persistent storage, URL seed, tracking or in-flight shuffle is added. See [visit variation QA](design/visit-variation-qa.md).
- Opening: a continuous dark sky and **fixed camera**, with a 2.6-second composition after 3D readiness. The initial HTML projects real background-star anchors into both layouts; a 1.15-second linear handoff develops the nebula without replacing a bright blue poster. Earth slides in from beyond the right edge with soft acceleration/braking (0.12–2.12s). The lunar floor and rocks emerge together from the bottom (0.65–2.60s), with a feathered reveal and at most 3.2 units of settlement instead of the old large upward lift. No camera descent/tilt/zoom or changing sunlight. Optional cloud/night textures wait until entry settles; manual controls remain live, reduced motion/reading skip, and returning home does not replay. No new bitmap, render target or draw batch is added; mobile ground remains 13,545 vertices. See [continuous-sky QA](design/continuous-sky-qa.md).
- **One-finger dragging only looks**, freely on both axes. **Spread two fingers to approach Earth; pinch them together to retreat.** Introductory text passes through to the sky, and star labels accept both gestures without accidentally opening an article. Adding/removing a finger rebases the gesture without a camera jump; a third finger pauses zoom until only two remain. Desktop dragging and horizontal trackpad scrolling still look; a vertical wheel still travels.
- Once the opening world settles, a small **조작 안내** cue demonstrates wheel movement or two-finger spreading and explains looking/reading in Korean. It uses the primary pointer capability (not screen width), then follows actual touch/mouse input on hybrid devices. Meaningful input, automatic journey, slider use or opening a star dismisses it for that visit; the button above the travel slider can show it again without resetting the journey. The icon repeats only three times, then rests; reduced motion/pause keep it static. The cue is pointer-transparent, hidden during reading/loading/failures/Earth focus, and contains no discovery hint. See [interaction guidance QA](design/interaction-guide-qa.md).
- Pinch uses `0.18 × log(new span / previous span)`, sampled once per animation frame; doubling finger spacing requests about 12.5% of the route before speed/coast limits. Pure two-finger translation does not also pan/zoom the camera. Normal flight is capped at 7.5% of the route per second with a short, bounded coast; switching to one-finger looking clears that coast. A 100 px wheel event still requests 1.8%. Reverse input brakes immediately. The slider and keyboard remain direct alternatives; reading panels and controls retain native page zoom. See [pinch QA](design/pinch-controls-qa.md).
- Tap the compass to center the view without resetting travel. Reading a star and returning preserves the previous viewing direction. A drag does not accidentally open an article; ordinary star taps and keyboard activation still work.
- “나의 우주 유영하기” starts a slow automatic journey. Manual input stops the cruise.
- Easter egg (implementation spoiler): there is **no pre-discovery card, reception meter, text hint, hold button or shortcut**. Fresh manual input beyond the normal Earth boundary enters a Korea-focused close-up. As approach continues, the camera settles toward Seoul and a small warm light gradually brightens on its actual geographic surface; this is the only new visual clue. Ordinary travel shows no light. Resistance still increases **without forced bounces**, but the approach is attainable: simulations give 7.7s at maximum pressure, about 10.7s for deliberate wheel/trackpad input and 11.1–15.5s for repeated pinches including 0.4–0.8s finger resets. After a 0.95s input grace, stopping returns to the original Earth orbit/scale and fades the light; resuming input immediately interrupts the return. Only discovery reveals the GitHub / Velog destinations, which remain open. Auto-cruise and the slider stop at the normal boundary; keyboard input uses the same effort model. Reverse, “다시 별들 사이로”, `Esc`, or `Home` let you leave. Reduced motion retains manual access with no timed light animation and an immediate reset after release grace. Non-WebGL discovery and the complete reading fallback remain available. See [Seoul signal QA](design/seoul-signal-qa.md); simulation timings are not physical-device measurements.
- Select a star to read, or use “글 모아보기” to search all posts and filter by topic or code content.
- Photo-only posts are readable too. Images stay in their original order, fit the mobile reader without cropping, and link to their original size in a new tab. Only the first image loads eagerly; later images load as they approach the viewport. Each failed image has its own retry and Velog fallback.
- From a distance, topic nebulae summarize a region; select one to approach its individual stars. If several stars sit under one tap, choose from the nearby-story list.
- New writing expands into year/topic sectors of at most 96 stars. “탐험 구역” switches regions without moving existing stars; the full archive searches across every region, with year filtering and 24 stories per page.
- Keyboard: `/` opens search, `←` / `→` look around, `↑` / `PageDown` move toward Earth, `↓` / `PageUp` return toward the Moon, `Home` returns to the beginning, and `Esc` closes the current panel.
- The bottom slider offers direct, keyboard-accessible travel. Sound starts muted and is generated locally with Web Audio.
- Reduced-motion preferences disable ambient animation and animated camera transitions. The pause control stops ambient motion and automatic travel.
- Even at rest, the universe moves: procedural nebula flow, independently shimmering stars, two-depth drifting dust, moving cloud shadows and a faint polar atmospheric shimmer. A brief distant light trail passes every 16–24 seconds, first appearing after 3.5–7.5 seconds according to the visit seed; trails never stack. These are artistic atmosphere effects, not a physical simulation or additional article stars. The Earth-focus mode fades the decorative sky out to keep Korea unobstructed.
- Atmospheric effects freeze while a panel is open or motion is paused/reduced. Hidden tabs stop both the ambient clock and canvas rendering; resuming does not fast-forward the scene. Decorative dust is one GPU point batch (480 particles on mobile / 960 on desktop), with one quarter in a smaller, faster near volume; the occasional trail adds one draw only while visible. Existing article coordinates and picking targets do not move with these effects. See [Earth focus and idle-motion QA](design/earth-focus-qa.md) for the current checks and live-verification limitation.
- The immersive reader retains the `?article=<slug>` address; old numeric article links also resolve. Search filters are shareable in the URL. Each article also has a permanent `/writing/<slug>/` reading page for search engines and sharing, with a link back to its star.
- If WebGL or an asset fails, the full searchable reading archive remains available.

## Scene and content

`src/utils/observatory.js` builds metadata from the checked-in Velog archive. Categories are inferred from titles and code content. `src/data/sky-registry.json` is an append-only record of star coordinates, numeric link aliases, and sectors. Keep it in Git: a new, reordered or removed post must not change an existing star's saved coordinates or reuse its old link. Visit-specific offsets are applied only at runtime, without rewriting this registry. The original Moon–Earth route retains its 58 stars; new posts go into stable year/topic sectors, with overflow creating another sector automatically.

`UniverseScene.jsx` handles travel and the procedural background; `CelestialBodies.jsx` renders Earth's day/night/cloud/atmosphere shaders and the lunar terrain. `ArticleSky.jsx` draws the active sector in one `THREE.Points` batch, plus at most four topic nebula sprites. Nearby picking uses a capped screen-space candidate list (36 mobile / 64 desktop), checked five times a second, instead of a raycast mesh per article. Labels are capped at 3 / 5 and avoid one another, controls, and Earth. Existing readable labels keep priority over newly nearer stars, topic/article switching uses hysteresis, and retiring labels fade before their replacements appear. Stars also fade gradually near the camera and screen edges; their saved coordinates are unchanged.

Earth uses one opaque geographic surface, one thin cloud-only shell and one atmospheric rim. All share the Korea-centered geographic frame and bounded sway. The cloud shell samples only the packed texture's blue channel, has at most 36% opacity, moves about 1.7° per active minute and casts a faint 6% shadow; it does not repaint moving white regions into the terrain color. The additional cloud draw reuses existing textures. See [Earth-layer QA](design/earth-layers-qa.md).

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

The separate reading-layout fallback is restricted to `<noscript>` so it cannot flash before the universe. Its CSS is loaded only for no-JS reading; every individual SEO article page remains complete HTML. Browser media/URL state is restored after matching hydration, and URL rewriting waits for restoration. The local font uses `font-display: optional` with preload to avoid a delayed swap.

Refresh starts with an inline decorative star/nebula backdrop in the real prerendered App, not an empty canvas or a different page. Only Earth's day map and the Moon map gate the base scene (711 KB combined, versus 2,487 KB for all four maps). They are discovered from HTML; low-priority scene/Three modulepreloads start the lazy runtime fetch early. Shared JSX/CJS helpers live in the React vendor chunk, so the initial UI no longer statically depends on the 3D bundle. After async shader preparation and two complete frames, the canvas crossfades over the backdrop for 1.4 seconds; the backdrop is then removed. Clouds/night lights load afterward in their own nonfatal boundary and blend into the same Earth. Reduced motion skips transitions. Service-worker cache writes run in the background instead of delaying response streams, while existing offline fallback remains. See [progressive startup QA](design/progressive-startup-qa.md) for build checks and live-verification limits.

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
