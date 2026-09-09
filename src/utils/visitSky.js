import { seededRandom, earthPosition, EARTH_RADIUS } from "./observatory.js";

export const VISIT_STATE_KEY = "uiwwswSkyVisit";
export const STAR_WANDER_RADIUS = 3.2;
const validSeed = (value) =>
  Number.isInteger(value) && value > 0 && value <= 0xffffffff;

// Called once by the client entry, outside React/StrictMode. A reload is a new
// night; history-back restores that entry's night even without the bfcache.
// No localStorage, cookie, URL parameter, clock-driven reshuffle or tracking.
export function beginSkyVisit(host) {
  let previous;
  try {
    previous = host.history.state?.[VISIT_STATE_KEY];
    if (
      host.performance.getEntriesByType("navigation")[0]?.type ===
        "back_forward" &&
      validSeed(previous)
    )
      return previous;
  } catch {
    /* Restricted history must not prevent a visit. */
  }
  let seed;
  try {
    seed = host.crypto.getRandomValues(new Uint32Array(1))[0];
  } catch {
    seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  }
  if (!validSeed(seed)) seed = 1;
  if (seed === previous) seed = (seed + 0x9e3779b9) >>> 0 || 1;
  try {
    host.history.replaceState(
      { ...host.history.state, [VISIT_STATE_KEY]: seed },
      "",
    );
  } catch {
    /* Browsing still works when history persistence is unavailable. */
  }
  return seed;
}

const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const hash = (id, seed) =>
  [...id].reduce(
    (n, char) => Math.imul(n ^ char.charCodeAt(0), 16777619) >>> 0,
    seed >>> 0,
  );

// Runtime positions only. Never mutate the append-only registry, catalog order,
// IDs, canonical URLs or bodies. Sorting per sector makes results independent
// of API/search order; tests bound work to the existing 96-star sector capacity.
export function arrangeVisitStars(articles, sectors, seed) {
  if (!seed) return articles;
  const groups = new Map();
  const origins = new Map(sectors.map((s) => [s.id, s.origin]));
  for (const article of articles) {
    const id = article.sectorId || "home";
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(article);
  }
  const positions = new Map();
  const planets = [earthPosition(false), earthPosition(true)];
  for (const [sectorId, stars] of groups) {
    const origin = origins.get(sectorId) || [0, 0, 0];
    const ordered = [...stars].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
    for (const article of ordered) {
      const random = seededRandom(hash(article.id, seed));
      const base = article.position;
      const neighbors = ordered
        .filter((other) => other !== article)
        .map((other) => ({
          position: positions.get(other.id) || other.position,
          clearance: Math.min(2, distance(base, other.position)),
        }));
      const planetClearance = planets.map((planet) =>
        Math.min(EARTH_RADIUS + 3, distance(base, planet)),
      );
      let next = [...base];
      for (let attempt = 0; attempt < 24; attempt++) {
        const offset = [
          (random() - 0.5) * 6,
          (random() - 0.5) * 3,
          (random() - 0.5) * 6,
        ];
        if (Math.hypot(...offset) > STAR_WANDER_RADIUS) continue;
        const candidate = base.map((v, i) => v + offset[i]);
        const local = candidate.map((v, i) => v - origin[i]);
        if (
          local[0] < -24.5 ||
          local[0] > 24.5 ||
          local[1] < -1 ||
          local[1] > 23 ||
          local[2] < -49 ||
          local[2] > -6
        )
          continue;
        if (
          neighbors.some(
            (other) =>
              distance(candidate, other.position) < other.clearance - 1e-9,
          )
        )
          continue;
        if (
          planets.some(
            (planet, i) =>
              distance(candidate, planet) < planetClearance[i] - 1e-9,
          )
        )
          continue;
        next = candidate;
        break;
      }
      positions.set(article.id, next);
    }
  }
  return articles.map((article) => ({
    ...article,
    position: positions.get(article.id),
  }));
}
