import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "vite";
import { load } from "cheerio";
import { createHomeSnapshot } from "../src/utils/homeSnapshot.js";
import { articlePath } from "../src/utils/seo.js";
import { FLIGHT_GUIDANCE } from "../src/utils/flightGuide.js";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const catalog = JSON.parse(
  readFileSync(new URL("../src/data/velog-index.json", import.meta.url)),
);

test("first-paint snapshot stays bounded even when the article catalog grows", () => {
  const snapshot = createHomeSnapshot(catalog.articles);
  const essay =
    catalog.articles.find((article) => article.topic === "essay") ||
    catalog.articles[0];
  assert.equal(snapshot.articleCount, catalog.articles.length);
  assert.equal(snapshot.latestEssay.id, essay.id);
  assert.deepEqual(Object.keys(snapshot.latestEssay).sort(), [
    "id",
    "slug",
    "title",
  ]);
  const large = createHomeSnapshot(
    Array.from({ length: 3000 }, (_, i) => ({
      ...essay,
      id: String(i),
      sentences: ["private body"],
    })),
  );
  assert.equal(large.articleCount, 3000);
  assert.ok(JSON.stringify(large).length < 1000);
  assert.ok(!JSON.stringify(large).includes("private body"));
  assert.deepEqual(createHomeSnapshot([]), {
    articleCount: 0,
    latestEssay: null,
  });
});

test("the real App prerenders without browser globals, WebGL or a replacement reading layout", async () => {
  assert.equal(typeof window, "undefined");
  assert.equal(typeof document, "undefined");
  const renderer = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
  try {
    const { renderHome } = await renderer.ssrLoadModule("/entry-server.jsx");
    const { default: SecretSignal } = await renderer.ssrLoadModule(
      "/components/SecretSignal.jsx",
    );
    const { default: FlightGuide } = await renderer.ssrLoadModule(
      "/components/FlightGuide.jsx",
    );
    // Reuse this SSR renderer instead of opening another HMR port in parallel.
    // Hidden guidance stays inaccessible; showing it adds no interactive overlay.
    for (const touch of [false, true])
      for (const visible of [false, true])
        for (const quiet of [false, true]) {
          const $ = load(
            renderToStaticMarkup(
              React.createElement(FlightGuide, { touch, visible, quiet }),
            ),
          );
          const guide = $("#flight-guide");
          assert.equal(guide.attr("role"), "note");
          assert.equal(guide.attr("aria-label"), "우주 조작 안내");
          assert.equal(guide.attr("aria-hidden"), String(!visible));
          assert.equal(guide.attr("data-visible"), String(visible));
          assert.equal(guide.attr("data-quiet"), String(quiet));
          assert.equal(guide.is("[inert]"), !visible);
          assert.equal(guide.find("button, a, input, canvas, img").length, 0);
          assert.equal(guide.find("svg[aria-hidden=true]").length, 1);
          assert.equal(guide.find(".guide-finger").length, touch ? 2 : 0);
          assert.equal(guide.find(".guide-wheel").length, touch ? 0 : 1);
          assert.equal(
            guide.find("p").text(),
            FLIGHT_GUIDANCE[touch ? "touch" : "mouse"].title,
          );
        }
    for (const strength of [0, 0.25, 0.99, 0.99999]) {
      assert.equal(
        renderToStaticMarkup(React.createElement(SecretSignal, { strength })),
        "",
      );
    }
    const reward = load(
      renderToStaticMarkup(React.createElement(SecretSignal, { strength: 1 })),
    );
    assert.equal(reward(".secret-destinations a").length, 2);
    assert.equal(reward("[data-flight-control]").length, 1);
    assert.equal(reward('[role="meter"]').length, 0);
    for (const articles of [catalog.articles, []]) {
      const snapshot = createHomeSnapshot(articles);
      const html = renderHome(snapshot);
      const $ = load(html);
      assert.equal($("main.observatory").length, 1);
      assert.equal($(".site-header").length, 1);
      assert.equal($(".intro h1").length, 1);
      assert.equal($(".flight-deck").length, 1);
      assert.equal($("#flight-guide[aria-hidden='true'][inert]").length, 1);
      assert.equal(
        $(
          ".flight-help[aria-controls='flight-guide'][aria-expanded='false'][disabled]",
        ).length,
        1,
      );
      assert.equal($(".static-fallback, canvas, dialog").length, 0);
      assert.equal($(".opening-sky[aria-hidden='true']").length, 1);
      assert.equal($(".opening-stars-wide circle").length, 96);
      assert.equal($(".opening-stars-touch circle").length, 96);
      assert.equal($(".opening-sky image, .opening-sky img").length, 0);
      assert.equal($(".secret-signal").length, 0);
      assert.equal($(".nav-count").text(), String(articles.length));
      assert.match(
        $(".intro-caption").text(),
        new RegExp(`${articles.length}개의 기록`),
      );
      if (snapshot.latestEssay)
        assert.equal(
          $(".featured-signal").attr("href"),
          articlePath(snapshot.latestEssay),
        );
      else assert.equal($(".featured-signal").length, 0);
      assert.equal(
        renderHome(snapshot),
        html,
        "Server snapshots must be deterministic for hydration",
      );
    }
  } finally {
    await renderer.close();
  }
});

test("startup uses hydration, defers the scene, and prevents a late font/partial-scene pop", () => {
  const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(read("src/main.jsx"), /ReactDOM\.hydrateRoot\(root, app\)/);
  assert.match(read("src/App.jsx"), /clientReady && !sceneError/);
  assert.match(
    read("src/App.jsx"),
    /signal >= 1 && sectorId === "home" && !panel/,
  );
  assert.doesNotMatch(read("src/App.jsx"), /저항 너머|희미한 신호|가까워지고/);
  assert.doesNotMatch(
    read("src/components/SecretSignal.jsx"),
    /onApproach|setInterval|role="meter"|UNIDENTIFIED/,
  );
  assert.match(
    read("src/App.jsx"),
    /inert=\{focusingEarth \? "" : undefined\}/,
  );
  assert.match(
    read("src/components/UniverseScene.jsx"),
    /earthFocusRef\.current\.toArray\(\)/,
  );
  assert.match(
    read("src/components/CelestialBodies.jsx"),
    /focusRef\.current\s*\.copy\(korea\)/,
  );
  assert.match(read("src/App.jsx"), /if \(!locationReady\) return/);
  assert.match(read("src/App.jsx"), /if \(!loadedArticle\?\.bodyUrl\) return/);
  assert.match(read("src/index.css"), /font-display: optional/);
  assert.match(read("src/index.css"), /\.universe-canvas \{[^}]*opacity: 0/s);
  assert.match(
    read("src/index.css"),
    /\.scene-ready \.universe-canvas \{\s*opacity: 1/s,
  );
  assert.match(
    read("src/components/UniverseScene.jsx"),
    /gl\.compileAsync\(scene, camera\)/,
  );
  assert.match(read("src/App.jsx"), /!sceneSettled && <OpeningSky/);
  assert.match(read("src/App.jsx"), /sceneReady && reducedMotion/);
  assert.match(read("src/App.jsx"), /data-reduced-motion=\{reducedMotion\}/);
  assert.match(
    read("src/index.css"),
    /\[data-reduced-motion="true"\] \.universe-canvas \{\s*transition: none/,
  );
  assert.match(read("src/index.css"), /transition: opacity 1\.15s linear/);
  assert.ok(!read("src/index.html").includes("/fonts/SUITE-Variable.css"));
  assert.ok(!read("public/sw.js").includes("SUITE-Variable.ttf"));
});
