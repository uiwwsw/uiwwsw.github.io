# uiwwsw.github.io

A 3D writing portfolio: leave the Moon, approach Earth, and discover a real Velog article in every star. Built with React, Vite, Three.js, React Three Fiber, and drei.

## Exploring the universe

- Scroll (or swipe vertically) to travel; swipe horizontally to look around, including gestures begun over the introductory text or star labels. Touch gestures lock to the first direction to avoid accidental diagonal travel. Desktop dragging also adjusts vertical view, and horizontal trackpad scrolling pans.
- Tap the compass to center the view without resetting travel. Reading a star and returning preserves the previous viewing direction. A drag does not accidentally open an article; ordinary star taps and keyboard activation still work.
- “나의 우주 유영하기” starts a slow automatic journey. Manual input stops the cruise.
- Easter egg: after reaching Earth, keep scrolling or swiping upward to receive a hidden signal and reveal the GitHub / Velog destinations. Auto-cruise stops before this extra approach. The signal button and the slider's forward arrow keys also work; reverse travel, “다시 별들 사이로”, `Esc`, or `Home` let you leave and discover it again. The reveal is non-modal, never auto-opens an external link, and remains available without WebGL or motion.
- Select a star to read, or use “글 모아보기” to search all posts and filter by topic or code content.
- From a distance, topic nebulae summarize a region; select one to approach its individual stars. If several stars sit under one tap, choose from the nearby-story list.
- New writing expands into year/topic sectors of at most 96 stars. “탐험 구역” switches regions without moving existing stars; the full archive searches across every region, with year filtering and 24 stories per page.
- Keyboard: `/` opens search, `←` / `→` look around, `↑` / `PageDown` move toward Earth, `↓` / `PageUp` return toward the Moon, `Home` returns to the beginning, and `Esc` closes the current panel.
- The bottom slider offers direct, keyboard-accessible travel. Sound starts muted and is generated locally with Web Audio.
- Reduced-motion preferences disable ambient animation and animated camera transitions. The pause control stops ambient motion and automatic travel.
- Article links retain the `?article=<slug>` address; old numeric article links also resolve. Search filters are shareable in the URL.
- If WebGL or an asset fails, the full searchable reading archive remains available.

## Scene and content

`src/utils/observatory.js` builds metadata from the checked-in Velog archive. Categories are inferred from titles and code content. `src/data/sky-registry.json` is an append-only record of star coordinates, numeric link aliases, and sectors. Keep it in Git: a new, reordered or removed post must not displace an existing star or reuse its old link. The original Moon–Earth route retains its 58 stars; new posts go into stable year/topic sectors, with overflow creating another sector automatically.

`UniverseScene.jsx` handles travel and the procedural background; `CelestialBodies.jsx` renders Earth's day/night/cloud/atmosphere shaders and the lunar terrain. `ArticleSky.jsx` draws the active sector in one `THREE.Points` batch, plus at most four topic nebula sprites. Nearby picking uses a capped screen-space candidate list (36 mobile / 64 desktop), checked five times a second, instead of a raycast mesh per article. Labels are capped at 3 / 5 and avoid one another, controls, and Earth.

`npm run prepare-content` generates a metadata-only `src/data/velog-index.json` and content-addressed `public/data/articles/*.json` bodies. Dev, test and build run it automatically. Generated files are ignored; source content and the stable registry are tracked. The reader fetches a body only when selected, cancels stale requests, offers retry on failure, and retains at most 12 bodies in memory. New or uncached bodies require a network connection; an external Velog link remains available on errors.

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

## Scaling verification

`npm test` covers content integrity, stable links/positions, 300/1,000/3,000-post sectors, selection bounds, loader retry/cache/cancellation, pagination safety, touch input, Korea orientation and the secret signal.

In development only, `?stress=300`, `?stress=1000`, and `?stress=3000` add clearly marked synthetic writing and a rendering counter. Combine with `&webgl=off` or `&motion=reduce` for fallback checks. These switches and synthetic articles are excluded from production builds. See [the QA record](design/scaling-qa.md) for observations and limits. If the metadata catalog itself becomes too large, the next step is year-sharded indexes; batching the scene does not eliminate metadata download costs.
