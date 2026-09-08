import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  buildCatalog,
  filterCatalog,
  flightPose,
  earthPosition,
  EARTH_RADIUS,
} from "../src/utils/observatory.js";
import {
  extendRegistry,
  groupSectors,
  SECTOR_CAPACITY,
} from "../src/utils/skyRegistry.js";
import { makeStressCatalog } from "../src/utils/stressCatalog.js";
import {
  pickBudget,
  nearbyStars,
  packStarLabels,
} from "../src/utils/starSelection.js";

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const source = json("../src/data/velog-context.json");
const registry = json("../src/data/sky-registry.json");
const index = json("../src/data/velog-index.json");

test("metadata contains no bodies; every content-addressed body exactly matches its source", () => {
  const catalog = buildCatalog(source);
  assert.equal(index.articles.length, catalog.length);
  for (const article of index.articles) {
    for (const field of [
      "sentences",
      "sourceHash",
      "sourceETag",
      "sourceModified",
    ])
      assert.equal(field in article, false);
    const raw = readFileSync(
      new URL(`../public${article.bodyUrl}`, import.meta.url),
    );
    const body = JSON.parse(raw);
    assert.equal(
      article.bodyUrl,
      `/data/articles/${createHash("sha256").update(raw).digest("hex")}.json`,
    );
    const original = catalog.find((item) => item.id === article.id);
    assert.deepEqual(body, { id: article.id, sentences: original.sentences });
    assert.equal(article.codeCount, original.codeCount);
    assert.equal(article.legacyId, registry.stars[article.id].legacyId);
    assert.deepEqual(article.position, registry.stars[article.id].position);
  }
});

test("saved star positions and numeric aliases survive insertion, deletion, and source renumbering", () => {
  const changed = Object.fromEntries(
    Object.values(source)
      .reverse()
      .slice(1)
      .map((article, i) => [i + 500, article]),
  );
  changed[0] = {
    slug: "new-api-star",
    title: "API 기록",
    publishedAt: "2027-02-02",
    sentences: [],
  };
  const next = extendRegistry(changed, registry);
  for (const [id, star] of Object.entries(registry.stars))
    assert.deepEqual(next.stars[id], star);
  assert.ok(
    !Object.values(registry.stars).some(
      (star) => star.legacyId === next.stars["new-api-star"].legacyId,
    ),
  );
  assert.deepEqual(extendRegistry(changed, next), next);
  assert.deepEqual(extendRegistry(source, registry), registry);
});

for (const count of [300, 1000, 3000]) {
  test(`${count} articles keep one addressable star each and bound every sector to ${SECTOR_CAPACITY}`, () => {
    const targetCount = Math.max(count, index.articles.length);
    const stress = makeStressCatalog(index, targetCount);
    assert.equal(stress.articles.length, targetCount);
    assert.equal(
      new Set(stress.articles.map((item) => item.id)).size,
      targetCount,
    );
    assert.equal(
      new Set(stress.articles.map((item) => item.legacyId)).size,
      targetCount,
    );
    const sectors = groupSectors(stress.articles, stress.sectors);
    assert.equal(
      sectors.reduce((sum, sector) => sum + sector.articles.length, 0),
      targetCount,
    );
    for (const sector of sectors) {
      assert.ok(sector.articles.length <= SECTOR_CAPACITY);
      for (const article of sector.articles)
        assert.ok(article.position.every(Number.isFinite));
      for (const compact of [false, true]) {
        for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
          const position = flightPose(progress, compact).position.map(
            (value, axis) => value + sector.origin[axis],
          );
          assert.ok(
            Math.hypot(
              ...position.map(
                (value, axis) => value - earthPosition(compact)[axis],
              ),
            ) >
              EARTH_RADIUS + 5,
          );
        }
      }
    }
    for (const article of index.articles) {
      const same = stress.articles.find((item) => item.id === article.id);
      assert.deepEqual(same.position, article.position);
      assert.equal(same.legacyId, article.legacyId);
    }
  });
}

test("empty archives keep a navigable home sector", () => {
  const empty = extendRegistry({});
  assert.deepEqual(empty.stars, {});
  assert.equal(groupSectors([], empty.sectors)[0].id, "home");
});

test("year filtering combines with search, topic and code filters", () => {
  const articles = [
    {
      title: "API 기록",
      publishedAt: "2026-05-01",
      topic: "engineering",
      codeCount: 1,
    },
    {
      title: "API 기록",
      publishedAt: "2025-05-01",
      topic: "engineering",
      codeCount: 1,
    },
  ];
  assert.equal(
    filterCatalog(articles, "API", "engineering", true, "2026").length,
    1,
  );
  assert.equal(
    filterCatalog(articles, "API", "engineering", true, "2024").length,
    0,
  );
});

test("tap ambiguity is bounded, nearest first, with larger mobile hit areas", () => {
  const candidates = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: i,
    y: 0,
    distance: i,
  }));
  assert.equal(pickBudget(true), 36);
  assert.equal(pickBudget(false), 64);
  assert.deepEqual(
    nearbyStars(candidates, 0, 0, true).map((item) => item.id),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(nearbyStars([{ x: 20, y: 0 }], 0, 0, false).length, 0);
  assert.equal(nearbyStars([{ x: 20, y: 0 }], 0, 0, true).length, 1);
  assert.equal(nearbyStars(candidates, 1000, 1000, true).length, 0);
});

test("labels stay bounded and do not overlap, including narrow screens", () => {
  for (const [width, height, compact] of [
    [390, 844, true],
    [1280, 720, false],
  ]) {
    const candidates = Array.from({ length: 500 }, (_, i) => ({
      id: i,
      x: (i * 73) % width,
      y: (i * 39) % height,
    }));
    const labels = packStarLabels(candidates, width, height, compact);
    assert.ok(labels.length > 0 && labels.length <= (compact ? 3 : 5));
    for (let i = 0; i < labels.length; i++)
      for (let j = i + 1; j < labels.length; j++)
        assert.ok(
          Math.abs(labels[i].x - labels[j].x) >= (compact ? 170 : 212) ||
            Math.abs(labels[i].y - labels[j].y) >= (compact ? 84 : 94),
        );
  }
});

test("favicon includes exact 16/32 pixel assets, touch icon and multiresolution ICO", () => {
  for (const [filename, size] of [
    ["favicon-moon-v3-16.png", 16],
    ["favicon-moon-v3-32.png", 32],
    ["apple-touch-moon-v3.png", 180],
  ]) {
    const png = readFileSync(new URL(`../public/${filename}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  const ico = readFileSync(new URL("../public/favicon.ico", import.meta.url));
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  assert.deepEqual([ico[6], ico[22], ico[38]], [16, 32, 48]);
});

test("label rectangles stay clear of Earth even if their star is outside its edge", () => {
  const candidate = { id: "edge", x: 600, y: 300 };
  assert.equal(packStarLabels([candidate], 1280, 720, false).length, 1);
  assert.equal(
    packStarLabels([candidate], 1280, 720, false, {
      x: 850,
      y: 300,
      radius: 150,
    }).length,
    0,
  );
});
