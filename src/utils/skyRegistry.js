import { buildCatalog, seededRandom } from "./observatory.js";

export const SECTOR_CAPACITY = 96;
export const REGISTRY_VERSION = 2;
export const HOME_SECTOR = {
  id: "home",
  label: "달 · 지구 항로",
  origin: [0, 0, 0],
  year: "all",
};

function placeStar(id, sector, occupied) {
  const seed = [...id].reduce(
    (n, char) => Math.imul(n ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
  const random = seededRandom(seed);
  let position;
  for (let attempt = 0; attempt < 100; attempt++) {
    position = [
      (random() - 0.5) * 49,
      random() * 24 - 1,
      -random() * 43 - 6,
    ].map((value, i) => value + sector.origin[i]);
    if (
      occupied.every(
        (star) =>
          Math.hypot(...position.map((value, i) => value - star.position[i])) >
          2,
      )
    )
      break;
  }
  return position;
}

// V1 froze the initial home batch and sent every subsequent post to a
// year/topic sector, even with free home slots. Repair that once. Existing home
// coordinates and every numeric alias survive; only overflow stars move home.
function migrateRegistry(registry) {
  if (registry.version >= REGISTRY_VERSION) return;
  const home = registry.sectors.find((sector) => sector.id === "home");
  const occupied = Object.values(registry.stars).filter(
    (star) => star.sectorId === "home",
  );
  const overflow = Object.entries(registry.stars)
    .filter(([, star]) => star.sectorId !== "home")
    .sort(
      ([a, left], [b, right]) =>
        Number(left.legacyId) - Number(right.legacyId) || a.localeCompare(b),
    );
  for (const [id, star] of overflow) {
    if (occupied.length >= SECTOR_CAPACITY) break;
    star.position = placeStar(id, home, occupied);
    star.sectorId = "home";
    occupied.push(star);
  }
  const used = new Set(Object.values(registry.stars).map((s) => s.sectorId));
  registry.sectors = registry.sectors
    .filter((sector) => sector.id === "home" || used.has(sector.id))
    .map((sector, index) => ({
      ...sector,
      label: sector.id === "home" ? HOME_SECTOR.label : `기록 성운 · ${index}`,
      year: "all",
    }));
  registry.version = REGISTRY_VERSION;
}

function nextSector(sectors) {
  let number = 1;
  while (sectors.some((sector) => sector.id === `nebula-${number}`)) number++;
  // Legacy sectors may leave holes after migration. Do not reuse an occupied
  // origin, even when the number of remaining sectors is smaller than before.
  let index = 0;
  let origin;
  do {
    index++;
    origin = [
      (index % 2 ? -1 : 1) * 100 * Math.ceil(index / 2),
      0,
      -35 * Math.floor(index / 2) || 0,
    ];
  } while (
    sectors.some((sector) => sector.origin.every((v, i) => v === origin[i]))
  );
  return {
    id: `nebula-${number}`,
    label: `기록 성운 · ${sectors.length}`,
    origin,
    year: "all",
  };
}

// After the one-time V1 repair, saved coordinates and numeric aliases are
// append-only, including deleted posts. Capacity, not year/topic/import batch,
// determines a new star's region; metadata filters remain separate.
export function extendRegistry(data, previous) {
  const catalog = buildCatalog(data);
  const registry = previous
    ? structuredClone(previous)
    : {
        version: REGISTRY_VERSION,
        sectors: [structuredClone(HOME_SECTOR)],
        stars: {},
      };
  migrateRegistry(registry);
  const existing = Object.values(registry.stars);
  const occupants = new Map(registry.sectors.map((sector) => [sector.id, []]));
  for (const star of existing) occupants.get(star.sectorId).push(star);
  let nextAlias =
    existing.reduce(
      (max, star) => Math.max(max, Number(star.legacyId) || 0),
      -1,
    ) + 1;
  const additions = catalog
    .filter((article) => !registry.stars[article.id])
    .sort(
      (a, b) =>
        (a.publishedAt || "").localeCompare(b.publishedAt || "") ||
        a.id.localeCompare(b.id),
    );
  for (const article of additions) {
    let sector = registry.sectors.find(
      (item) => occupants.get(item.id).length < SECTOR_CAPACITY,
    );
    if (!sector) {
      sector = nextSector(registry.sectors);
      registry.sectors.push(sector);
      occupants.set(sector.id, []);
    }
    const occupied = occupants.get(sector.id);
    registry.stars[article.id] = {
      position: placeStar(article.id, sector, occupied),
      sectorId: sector.id,
      legacyId: previous ? String(nextAlias++) : article.legacyId,
    };
    occupied.push(registry.stars[article.id]);
  }
  return registry;
}

export function groupSectors(articles, sectors) {
  const groups = new Map(
    sectors.map((sector) => [sector.id, { ...sector, articles: [] }]),
  );
  for (const article of articles)
    groups.get(article.sectorId)?.articles.push(article);
  return [...groups.values()].filter(
    (sector) => sector.id === "home" || sector.articles.length,
  );
}
