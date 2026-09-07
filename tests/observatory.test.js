import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildCatalog,
  filterCatalog,
  flightPose,
  earthPosition,
  EARTH_RADIUS,
} from "../src/utils/observatory.js";

const source = JSON.parse(
  readFileSync(new URL("../src/data/velog-context.json", import.meta.url)),
);
const catalog = buildCatalog(source);

test("every real article has exactly one addressable star and retains its content", () => {
  assert.equal(catalog.length, Object.keys(source).length);
  assert.equal(
    new Set(catalog.map((article) => article.id)).size,
    catalog.length,
  );
  for (const article of catalog) {
    const original = source[article.legacyId];
    assert.equal(article.link, original.link);
    assert.deepEqual(article.sentences, original.sentences);
    assert.equal(new URL(article.link).host, "velog.io");
    assert.ok(article.position.every(Number.isFinite));
  }
});

test("adding a post and changing source numeric IDs preserves existing star positions", () => {
  const nextSource = Object.fromEntries(
    Object.values(source)
      .reverse()
      .map((post, i) => [i + 100, post]),
  );
  nextSource[0] = { title: "새로운 별", slug: "new-star", sentences: [] };
  const next = buildCatalog(nextSource);
  for (const article of catalog)
    assert.deepEqual(
      next.find((item) => item.id === article.id).position,
      article.position,
    );
});

test("search combines Korean terms, categories and code-only without changing the catalog", () => {
  const sample = buildCatalog({
    0: {
      title: "인격이라는 소설에 대해",
      slug: "essay",
      summary: "사람을 생각하다",
      sentences: [],
    },
    1: {
      title: "API 테스트",
      slug: "api-test",
      sentences: [{ type: "code", fullSentence: "test()" }],
    },
    2: { title: "API 테스트 기록", slug: "api-notes", sentences: [] },
  });
  const original = JSON.stringify(sample);
  assert.ok(
    filterCatalog(sample, "인격").some(
      (article) => article.title === "인격이라는 소설에 대해",
    ),
  );
  assert.ok(
    filterCatalog(sample, "API 테스트", "engineering", true).length === 1,
  );
  assert.equal(filterCatalog(sample, "nonexistent-🌌-article").length, 0);
  const essays = filterCatalog(sample, "", "essay");
  assert.ok(
    essays.length > 0 && essays.every((article) => article.topic === "essay"),
  );
  assert.equal(JSON.stringify(sample), original);
});

test("the entire flight stays outside Earth on desktop and mobile, including overscroll", () => {
  for (const compact of [false, true]) {
    const earth = earthPosition(compact);
    for (let step = -10; step <= 110; step++) {
      const { position, target } = flightPose(step / 100, compact);
      assert.ok([...position, ...target].every(Number.isFinite));
      assert.ok(
        Math.hypot(...position.map((value, i) => value - earth[i])) >
          EARTH_RADIUS + 5,
      );
    }
    assert.deepEqual(flightPose(-1, compact), flightPose(0, compact));
    assert.deepEqual(flightPose(2, compact), flightPose(1, compact));
  }
});

test("empty archives remain usable", () => {
  assert.deepEqual(buildCatalog(null), []);
  assert.deepEqual(filterCatalog([], "별"), []);
});
