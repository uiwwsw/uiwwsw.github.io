import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  beginSkyVisit,
  VISIT_STATE_KEY,
  arrangeVisitStars,
  STAR_WANDER_RADIUS,
} from "../src/utils/visitSky.js";
import {
  createBackgroundStarData,
  createSkyPreview,
} from "../src/utils/skyBackdrop.js";
import {
  createDustField,
  createStreakSchedule,
  distantStreak,
} from "../src/utils/ambientMotion.js";
import { earthPosition, EARTH_RADIUS } from "../src/utils/observatory.js";
import { makeStressCatalog } from "../src/utils/stressCatalog.js";

const index = JSON.parse(
  readFileSync(new URL("../src/data/velog-index.json", import.meta.url)),
);
const separation = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const host = (type = "navigate", seed = 123) => ({
  history: {
    state: { other: "keep" },
    replaceState(state) {
      this.state = state;
    },
  },
  performance: { getEntriesByType: () => [{ type }] },
  crypto: {
    getRandomValues: (array) => {
      array[0] = seed;
      return array;
    },
  },
});

test("a new visit/reload changes the seed while history-back restores it and preserves other state", () => {
  const initial = host();
  assert.equal(beginSkyVisit(initial), 123);
  assert.deepEqual(initial.history.state, {
    other: "keep",
    [VISIT_STATE_KEY]: 123,
  });
  const back = host("back_forward", 999);
  back.history = initial.history;
  assert.equal(beginSkyVisit(back), 123);
  const reload = host("reload", 123);
  reload.history = initial.history;
  const next = beginSkyVisit(reload);
  assert.notEqual(next, 123);
  assert.equal(reload.history.state[VISIT_STATE_KEY], next);
  const zeros = host("reload", 0);
  zeros.history.state[VISIT_STATE_KEY] = 1;
  assert.notEqual(beginSkyVisit(zeros), 1);
});

test("invalid history, unavailable crypto and blocked persistence cannot prevent a usable visit", () => {
  for (const previous of [0, -1, NaN, Infinity, "123", 0x100000000]) {
    const invalid = host("back_forward");
    invalid.history.state[VISIT_STATE_KEY] = previous;
    assert.equal(beginSkyVisit(invalid), 123);
  }
  const blocked = host();
  Object.defineProperty(blocked.history, "state", {
    get() {
      throw new Error("blocked");
    },
  });
  blocked.crypto.getRandomValues = () => {
    throw new Error("unavailable");
  };
  const seed = beginSkyVisit(blocked);
  assert.ok(Number.isInteger(seed) && seed > 0 && seed <= 0xffffffff);
});

test("runtime star layouts vary by visit, not by catalog order, and preserve all metadata and original coordinates", () => {
  const original = structuredClone(index);
  assert.equal(
    arrangeVisitStars(index.articles, index.sectors, 0),
    index.articles,
  );
  const first = arrangeVisitStars(index.articles, index.sectors, 123);
  assert.deepEqual(
    first,
    arrangeVisitStars(index.articles, index.sectors, 123),
  );
  const other = arrangeVisitStars(index.articles, index.sectors, 456);
  const reversed = arrangeVisitStars(
    [...index.articles].reverse(),
    index.sectors,
    123,
  ).reverse();
  assert.deepEqual(first, reversed);
  assert.ok(
    first.filter((a, i) => separation(a.position, other[i].position) > 0.1)
      .length >
      index.articles.length * 0.85,
  );
  for (let i = 0; i < first.length; i++) {
    const { position, ...metadata } = first[i];
    assert.deepEqual(
      { ...metadata, position: index.articles[i].position },
      index.articles[i],
    );
    assert.notEqual(position, index.articles[i].position);
  }
  assert.deepEqual(index, original);
});

test("bounded wandering never worsens tight neighbors or Earth's clearance in either layout", () => {
  for (const seed of [1, 7, 42, 20260909, 0xffffffff]) {
    const next = arrangeVisitStars(index.articles, index.sectors, seed);
    for (let i = 0; i < next.length; i++) {
      const original = index.articles[i];
      const star = next[i];
      assert.ok(
        separation(star.position, original.position) <= STAR_WANDER_RADIUS,
      );
      const origin = index.sectors.find((s) => s.id === star.sectorId).origin;
      const local = star.position.map((v, j) => v - origin[j]);
      assert.ok(
        local[0] >= -24.5 &&
          local[0] <= 24.5 &&
          local[1] >= -1 &&
          local[1] <= 23 &&
          local[2] >= -49 &&
          local[2] <= -6,
      );
      for (const compact of [false, true])
        assert.ok(
          separation(star.position, earthPosition(compact)) >=
            Math.min(
              EARTH_RADIUS + 3,
              separation(original.position, earthPosition(compact)),
            ) -
              1e-9,
        );
      for (let j = 0; j < i; j++)
        if (next[j].sectorId === star.sectorId)
          assert.ok(
            separation(star.position, next[j].position) >=
              Math.min(
                2,
                separation(original.position, index.articles[j].position),
              ) -
                1e-9,
          );
    }
  }
});

test("3,000 articles remain one star each with stable sectors and bounded local changes", () => {
  const stress = makeStressCatalog(index, 3000);
  const next = arrangeVisitStars(stress.articles, stress.sectors, 42);
  assert.equal(next.length, 3000);
  assert.equal(new Set(next.map((a) => a.id)).size, 3000);
  for (let i = 0; i < next.length; i++) {
    assert.equal(next[i].sectorId, stress.articles[i].sectorId);
    assert.ok(next[i].position.every(Number.isFinite));
    assert.ok(
      separation(next[i].position, stress.articles[i].position) <=
        STAR_WANDER_RADIUS,
    );
  }
  assert.deepEqual(arrangeVisitStars([], [], 42), []);
});

test("every first-paint anchor keeps its exact GPU position/color/phase while more than 95% of the background varies", () => {
  for (const compact of [false, true]) {
    const base = createBackgroundStarData(compact);
    for (const seed of [1, 42, 0xffffffff]) {
      const varied = createBackgroundStarData(compact, seed);
      assert.deepEqual(varied, createBackgroundStarData(compact, seed));
      assert.equal(varied.sizes.length, base.sizes.length);
      for (const { id } of createSkyPreview(compact)) {
        for (const key of ["positions", "colors"])
          assert.deepEqual(
            varied[key].slice(id * 3, id * 3 + 3),
            base[key].slice(id * 3, id * 3 + 3),
          );
        for (const key of ["sizes", "phases"])
          assert.equal(varied[key][id], base[key][id]);
      }
      let changed = 0;
      for (let i = 0; i < base.sizes.length; i++)
        if (varied.positions[i * 3] !== base.positions[i * 3]) changed++;
      assert.equal(changed, base.sizes.length - 96);
      assert.ok(changed > base.sizes.length * 0.95);
    }
  }
});

test("dust flow and single meteor schedules vary without adding particles, flashes or overlapping trails", () => {
  for (const compact of [false, true]) {
    const a = createDustField(compact, 1),
      b = createDustField(compact, 2);
    assert.notDeepEqual(a.positions, b.positions);
    assert.notDeepEqual(a.velocity, b.velocity);
    assert.deepEqual(a, createDustField(compact, 1));
    assert.equal(a.sizes.length, compact ? 480 : 960);
  }
  const schedules = [1, 2, 3, 42, 20260909].map((seed) =>
    createStreakSchedule(seed),
  );
  assert.equal(
    new Set(schedules.map((s) => JSON.stringify(s))).size,
    schedules.length,
  );
  for (const schedule of schedules) {
    assert.ok(
      schedule.first >= 3.5 &&
        schedule.first <= 7.5 &&
        schedule.period >= 16 &&
        schedule.period <= 24,
    );
    assert.equal(distantStreak(0, schedule).visible, false);
    assert.ok([-1, 1].includes(schedule.direction));
    for (let t = 0; t < 80; t += 0.05) {
      const state = distantStreak(t, schedule);
      assert.ok(state.opacity >= 0 && state.opacity <= 0.68);
      assert.ok(
        Math.abs(state.opacity - distantStreak(t + 0.05, schedule).opacity) <
          0.05,
      );
      assert.ok([0, 1, 2].includes(state.lane));
    }
  }
});

test("client entry chooses once outside React and reading/URL updates retain the same visit", () => {
  const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(
    read("src/main.jsx"),
    /const visitSeed = beginSkyVisit\(window\)/,
  );
  assert.match(
    read("src/main.jsx"),
    /<App initialHome=\{initialHome\} visitSeed=\{visitSeed\}/,
  );
  assert.match(
    read("src/App.jsx"),
    /window.history.replaceState\(\s*window.history.state/,
  );
  assert.match(
    read("src/App.jsx"),
    /arrangeVisitStars\(index.articles, index.sectors, visitSeed\)/,
  );
  assert.match(
    read("src/App.jsx"),
    /data-sky-visit=\{clientReady \? visitSeed : undefined\}/,
  );
  assert.doesNotMatch(
    read("src/utils/visitSky.js"),
    /setInterval|setTimeout|localStorage\.|sessionStorage\.|fetch\(/,
  );
});
