import test from "node:test";
import assert from "node:assert/strict";
import {
  createSceneStartup,
  SCENE_TEXTURES,
} from "../src/utils/sceneStartup.js";
import { readFileSync, statSync } from "node:fs";

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

test("cold startup never draws pending shaders and reveals after two complete frames", async () => {
  const pending = deferred();
  const calls = [];
  const startup = createSceneStartup({
    warm: () => {
      calls.push("warm");
      return pending.promise;
    },
    render: () => calls.push("render"),
    onReady: () => calls.push("ready"),
    onError: () => calls.push("error"),
  });
  startup.frame(false);
  assert.deepEqual(calls, []);
  for (let i = 0; i < 100; i++) startup.frame(true);
  assert.deepEqual(calls, ["warm"]);
  pending.resolve();
  await pending.promise;
  startup.frame(true);
  assert.deepEqual(calls, ["warm", "render"]);
  startup.frame(true);
  assert.deepEqual(calls, ["warm", "render", "render", "ready"]);
  startup.frame(true);
  assert.equal(calls.filter((v) => v === "ready").length, 1);
  assert.equal(calls.filter((v) => v === "render").length, 3);
});

test("cached shader startup has no artificial timer or minimum loading duration", async () => {
  let rendered = 0,
    ready = 0;
  const startup = createSceneStartup({
    warm: () => Promise.resolve(),
    render: () => rendered++,
    onReady: () => ready++,
    onError: () => assert.fail("unexpected failure"),
  });
  startup.frame(true);
  await Promise.resolve();
  startup.frame(false);
  assert.equal(rendered, 0);
  startup.frame(true);
  startup.frame(true);
  assert.equal(ready, 1);
});

test("unmount and late shader results never reveal a disposed scene", async () => {
  for (const reject of [false, true]) {
    const pending = deferred();
    let callbacks = 0;
    const startup = createSceneStartup({
      warm: () => pending.promise,
      render: () => callbacks++,
      onReady: () => callbacks++,
      onError: () => callbacks++,
    });
    startup.frame(true);
    startup.dispose();
    if (reject) pending.reject(new Error("lost context"));
    else pending.resolve();
    await pending.promise.catch(() => {});
    startup.frame(true);
    assert.equal(callbacks, 0);
  }
});

test("shader/render errors fail once and never expose an incomplete frame", async () => {
  for (const failure of ["sync", "async", "render"]) {
    let failed = 0;
    const startup = createSceneStartup({
      warm: () => {
        if (failure === "sync") throw new Error("shader");
        return failure === "async"
          ? Promise.reject(new Error("shader"))
          : Promise.resolve();
      },
      render: () => {
        throw new Error("draw");
      },
      onReady: () => assert.fail("partial frame was exposed"),
      onError: () => failed++,
    });
    startup.frame(true);
    await Promise.resolve();
    startup.frame(true);
    startup.frame(true);
    assert.equal(failed, 1);
  }
});

test("only day and Moon maps are critical; optional cloud/night maps cannot gate reveal", () => {
  const read = (path) =>
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const html = read("src/index.html");
  for (const name of ["day", "moon"])
    assert.ok(html.includes(SCENE_TEXTURES[name]));
  for (const name of ["night", "clouds"])
    assert.ok(!html.includes(SCENE_TEXTURES[name]));
  const sizes = Object.fromEntries(
    Object.entries(SCENE_TEXTURES).map(([key, path]) => [
      key,
      statSync(new URL(`../public${path}`, import.meta.url)).size,
    ]),
  );
  assert.ok(sizes.day + sizes.moon < 750000);
  assert.ok(
    (sizes.day + sizes.moon) / Object.values(sizes).reduce((a, b) => a + b) <
      0.3,
  );
  const earth = read("src/components/CelestialBodies.jsx");
  assert.match(earth, /const \[day\] = useTexture\(\[SCENE_TEXTURES\.day\]/);
  assert.match(earth, /enhance &&/);
  assert.match(earth, /<SceneBoundary onError=\{ignoreOptionalTextureError\}>/);
  assert.match(earth, /nightStrength: \{ value: 0 \}/);
  assert.match(earth, /cloudOpacity: \{ value: 0 \}/);
  assert.match(read("src/App.jsx"), /enhance=\{sceneSettled\}/);
});
