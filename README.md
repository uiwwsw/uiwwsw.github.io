# uiwwsw.github.io

A 3D writing portfolio: leave the Moon, approach Earth, and discover a real Velog article in every star. Built with React, Vite, Three.js, React Three Fiber, and drei.

## Exploring the universe

- Scroll (or swipe vertically) to travel; drag horizontally to look around. Desktop dragging also adjusts vertical view.
- “나의 우주 유영하기” starts a slow automatic journey. Manual input stops the cruise.
- Select a star to read, or use “글 모아보기” to search all posts and filter by topic or code content.
- Keyboard: `/` opens search, `↑` / `PageDown` move toward Earth, `↓` / `PageUp` return toward the Moon, `Home` returns to the beginning, and `Esc` closes the current panel.
- The bottom slider offers direct, keyboard-accessible travel. Sound starts muted and is generated locally with Web Audio.
- Reduced-motion preferences disable ambient animation and animated camera transitions. The pause control stops ambient motion and automatic travel.
- Article links retain the `?article=<slug>` address; old numeric article links also resolve. Search filters are shareable in the URL.
- If WebGL or an asset fails, the full searchable reading archive remains available.

## Scene and content

`src/utils/observatory.js` maps the checked-in Velog archive to deterministic stars: new posts never move the existing stars. Categories are inferred from titles. `UniverseScene.jsx` handles travel, screen-space label spacing, the star field and procedural nebula; `CelestialBodies.jsx` renders Earth's day/night/cloud/atmosphere shaders and the lunar terrain.

Planet texture sources and attribution are documented in `public/textures/README.md` and the site's About panel. Shading references the [Three.js Earth example](https://threejs.org/examples/webgpu_tsl_earth.html), implemented in GLSL for the existing WebGL stack. No game assets are used. Distances and star positions are artistic rather than astronomical.

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
