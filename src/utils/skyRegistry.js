import { buildCatalog, seededRandom, TOPICS } from "./observatory.js";

export const SECTOR_CAPACITY = 96;
export const HOME_SECTOR = {
  id: "home",
  label: "달 · 지구 항로",
  origin: [0, 0, 0],
  year: "all",
};

// Saved coordinates and numeric aliases are append-only, even after deletion.
// New articles never displace a star that somebody has already discovered.
export function extendRegistry(data, previous) {
  const catalog = buildCatalog(data);
  const registry = previous
    ? structuredClone(previous)
    : { version: 1, sectors: [HOME_SECTOR], stars: {} };
  if (!previous) {
    for (const article of catalog.slice(0, SECTOR_CAPACITY))
      registry.stars[article.id] = {
        position: article.position,
        sectorId: "home",
        legacyId: article.legacyId,
      };
  }
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
    const year = /^\d{4}/.exec(article.publishedAt || "")?.[0] || "undated";
    const prefix = `${year}-${article.topic}`;
    let sector = registry.sectors.find(
      (item) =>
        item.id.startsWith(`${prefix}-`) &&
        occupants.get(item.id).length < SECTOR_CAPACITY,
    );
    if (!sector) {
      const page =
        registry.sectors.filter((item) => item.id.startsWith(`${prefix}-`))
          .length + 1;
      const index = registry.sectors.length;
      sector = {
        id: `${prefix}-${page}`,
        label: `${year === "undated" ? "날짜 없는 기록" : year} · ${TOPICS[article.topic].label} · ${page}`,
        year,
        origin: [
          (index % 2 ? -1 : 1) * 100 * Math.ceil(index / 2),
          0,
          -35 * Math.floor(index / 2),
        ],
      };
      registry.sectors.push(sector);
      occupants.set(sector.id, []);
    }
    const occupied = occupants.get(sector.id);
    const seed = [...article.id].reduce(
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
            Math.hypot(
              ...position.map((value, i) => value - star.position[i]),
            ) > 2,
        )
      )
        break;
    }
    registry.stars[article.id] = {
      position,
      sectorId: sector.id,
      legacyId: String(nextAlias++),
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
