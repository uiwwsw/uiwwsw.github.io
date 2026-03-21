# uiwwsw.github.io

Developer Room landing page built with React, Vite, @react-three/fiber, and drei.

## Local development

```bash
npm install
npm run dev
```

Vite will start on the port shown in the terminal (default: http://localhost:5173).

## Production build

```bash
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
