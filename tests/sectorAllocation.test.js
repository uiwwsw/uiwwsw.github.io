import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  extendRegistry,
  groupSectors,
  HOME_SECTOR,
  REGISTRY_VERSION,
  SECTOR_CAPACITY,
} from "../src/utils/skyRegistry.js";
import { buildCatalog, filterCatalog } from "../src/utils/observatory.js";

const fixture = (count) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, i) => [
      String(i),
      {
        slug: `record-${i}`,
        title: ["일상 기록", "React API", "프로젝트 개발기", "성장 회고"][
          i % 4
        ],
        publishedAt: `${2020 + (i % 7)}-01-01`,
        sentences: [],
      },
    ]),
  );
const counts = (registry) =>
  registry.sectors.map(
    (sector) =>
      Object.values(registry.stars).filter(
        (star) => star.sectorId === sector.id,
      ).length,
  );
const indexed = (data, registry) =>
  buildCatalog(data).map((article) => ({
    ...article,
    ...registry.stars[article.id],
  }));

test("incremental imports fill the home route: 58 + 1 is 59, regardless of year or topic", () => {
  const previous = extendRegistry(fixture(58));
  const snapshot = structuredClone(previous);
  const next = extendRegistry(fixture(59), previous);
  assert.deepEqual(counts(next), [59]);
  assert.equal(next.stars["record-58"].sectorId, "home");
  assert.equal(next.version, REGISTRY_VERSION);
  for (const [id, star] of Object.entries(previous.stars))
    assert.deepEqual(next.stars[id], star);
  assert.deepEqual(previous, snapshot);
  assert.deepEqual(extendRegistry(fixture(59), next), next);
});

test("fresh and incremental imports share capacity boundaries at 96, 97, 192 and 193", () => {
  let incremental = extendRegistry(fixture(58));
  for (const count of [96, 97, 192, 193]) {
    const previous = incremental;
    incremental = extendRegistry(fixture(count), previous);
    const fresh = extendRegistry(fixture(count));
    const expected = Array.from(
      { length: Math.ceil(count / SECTOR_CAPACITY) },
      (_, i) => Math.min(SECTOR_CAPACITY, count - i * SECTOR_CAPACITY),
    );
    assert.deepEqual(counts(incremental), expected);
    assert.deepEqual(counts(fresh), expected);
    assert.equal(
      new Set(Object.values(incremental.stars).map((s) => s.legacyId)).size,
      count,
    );
    assert.equal(
      new Set(incremental.sectors.map((s) => s.origin.join(","))).size,
      expected.length,
    );
    for (const [id, star] of Object.entries(previous.stars))
      assert.deepEqual(incremental.stars[id], star);
    for (const sector of incremental.sectors) {
      assert.equal(sector.year, "all");
      assert.ok(sector.id === "home" || /^기록 성운 · \d+$/.test(sector.label));
    }
  }
});

test("V1 migration repairs a stranded article once, preserving all original home stars and aliases", () => {
  const data = fixture(59);
  const legacy = extendRegistry(fixture(58));
  legacy.version = 1;
  legacy.sectors.push({
    id: "2026-essay-1",
    label: "2026 · 사유와 일상 · 1",
    year: "2026",
    origin: [-100, 0, 0],
  });
  legacy.stars["record-58"] = {
    position: [-100, 10, -20],
    sectorId: "2026-essay-1",
    legacyId: "58",
  };
  const snapshot = structuredClone(legacy);
  const next = extendRegistry(data, legacy);
  assert.deepEqual(counts(next), [59]);
  assert.deepEqual(next.sectors, [HOME_SECTOR]);
  for (const [id, star] of Object.entries(legacy.stars)) {
    assert.equal(next.stars[id].legacyId, star.legacyId);
    if (star.sectorId === "home") assert.deepEqual(next.stars[id], star);
  }
  const moved = next.stars["record-58"];
  assert.equal(moved.sectorId, "home");
  assert.ok(Math.abs(moved.position[0]) <= 24.5);
  assert.ok(moved.position[1] >= -1 && moved.position[1] <= 23);
  assert.ok(moved.position[2] >= -49 && moved.position[2] <= -6);
  for (const [id, star] of Object.entries(next.stars))
    if (id !== "record-58")
      assert.ok(
        Math.hypot(...star.position.map((v, i) => v - moved.position[i])) > 2,
      );
  assert.deepEqual(legacy, snapshot);
  assert.deepEqual(extendRegistry(data, next), next);
  assert.deepEqual(
    extendRegistry(Object.fromEntries(Object.entries(data).reverse()), legacy),
    next,
  );
  assert.equal(
    indexed(data, next).find((a) => a.legacyId === "58").id,
    "record-58",
  );
});

test("migration never overfills home; remaining legacy regions retain IDs and coordinates", () => {
  const data = fixture(98);
  const legacy = extendRegistry(fixture(95));
  legacy.version = 1;
  const region = {
    id: "2026-essay-1",
    label: "2026 · 사유와 일상 · 1",
    year: "2026",
    origin: [-100, 0, 0],
  };
  legacy.sectors.push(region);
  for (const i of [95, 96])
    legacy.stars[`record-${i}`] = {
      sectorId: region.id,
      position: [-100 + (i - 95) * 3, 10, -20],
      legacyId: String(i),
    };
  const next = extendRegistry(data, legacy);
  assert.deepEqual(counts(next), [96, 2]);
  assert.equal(next.stars["record-95"].sectorId, "home");
  assert.deepEqual(next.stars["record-96"], legacy.stars["record-96"]);
  assert.equal(next.stars["record-97"].sectorId, region.id);
  assert.deepEqual(next.sectors[1], {
    ...region,
    label: "기록 성운 · 1",
    year: "all",
  });
  assert.deepEqual(extendRegistry(data, next), next);
});

test("deleted records reserve their slots and aliases; returning posts never reshuffle the sky", () => {
  const data = fixture(96);
  const previous = extendRegistry(data);
  const changed = fixture(97);
  delete changed[0];
  const next = extendRegistry(changed, previous);
  assert.deepEqual(counts(next), [96, 1]);
  assert.deepEqual(next.stars["record-0"], previous.stars["record-0"]);
  assert.notEqual(
    next.stars["record-96"].legacyId,
    previous.stars["record-0"].legacyId,
  );
  assert.equal(
    groupSectors(indexed(changed, next), next.sectors).reduce(
      (n, s) => n + s.articles.length,
      0,
    ),
    96,
  );
  const restored = extendRegistry(fixture(97), next);
  assert.deepEqual(restored, next);
});

test("metadata edits change filtering, not physical sectors or saved coordinates", () => {
  const data = fixture(59);
  const previous = extendRegistry(data);
  const changed = structuredClone(data);
  changed[0].title = "React API 개발";
  changed[0].publishedAt = "2031-01-01";
  const next = extendRegistry(changed, previous);
  assert.deepEqual(next, previous);
  const matches = filterCatalog(
    indexed(changed, next),
    "",
    "engineering",
    false,
    "2031",
  );
  assert.deepEqual(
    matches.map((a) => a.id),
    ["record-0"],
  );
  assert.equal(matches[0].sectorId, "home");
});

test("new regions avoid origins still occupied after legacy empty-region removal", () => {
  const data = fixture(289);
  const legacy = extendRegistry(fixture(288));
  legacy.version = 1;
  legacy.sectors[1].origin = [100, 0, -35];
  legacy.sectors[2].origin = [-200, 0, -35];
  legacy.sectors.splice(1, 0, {
    id: "empty",
    label: "old",
    origin: [-100, 0, 0],
    year: "2026",
  });
  const next = extendRegistry(data, legacy);
  assert.deepEqual(counts(next), [96, 96, 96, 1]);
  assert.equal(new Set(next.sectors.map((s) => s.origin.join(","))).size, 4);
  assert.deepEqual(next.sectors.at(-1).origin, [-100, 0, 0]);
  for (const [id, star] of Object.entries(legacy.stars))
    assert.deepEqual(next.stars[id], star);
});

test("the generated catalog exposes every real article exactly once in an occupied region", () => {
  const index = JSON.parse(
    readFileSync(new URL("../src/data/velog-index.json", import.meta.url)),
  );
  const registry = JSON.parse(
    readFileSync(new URL("../src/data/sky-registry.json", import.meta.url)),
  );
  const groups = groupSectors(index.articles, index.sectors);
  assert.equal(registry.version, REGISTRY_VERSION);
  assert.equal(groups.flatMap((s) => s.articles).length, index.articles.length);
  assert.equal(
    new Set(groups.flatMap((s) => s.articles.map((a) => a.id))).size,
    index.articles.length,
  );
  for (const group of groups)
    assert.ok(group.articles.length <= SECTOR_CAPACITY);
  if (Object.keys(registry.stars).length <= SECTOR_CAPACITY)
    assert.deepEqual(
      groups.map((s) => s.id),
      ["home"],
    );
});
