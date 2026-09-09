import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);
const deferred = () => {
  let resolve;
  const promise = new Promise((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
};

function setup({ fetcher, open, match = async () => undefined }) {
  const listeners = {};
  runInNewContext(source, {
    URL,
    console,
    Set,
    Promise,
    self: {
      location: { origin: "https://uiwwsw.github.io" },
      addEventListener: (name, handler) => {
        listeners[name] = handler;
      },
    },
    caches: { open, match },
    fetch: fetcher,
  });
  return (destination = "document", path = "/") => {
    const pending = [];
    let response;
    listeners.fetch({
      request: {
        url: `https://uiwwsw.github.io${path}`,
        method: "GET",
        destination,
        mode: destination === "document" ? "navigate" : "cors",
      },
      respondWith: (value) => {
        response = value;
      },
      waitUntil: (value) => pending.push(value),
    });
    return { response, pending };
  };
}

test("network responses stream before cache writes finish, and cloning precedes consumption", async () => {
  for (const destination of ["document", "script", "image"]) {
    const cacheOpen = deferred(),
      put = deferred();
    let cloned = false;
    const response = {
      status: 200,
      type: "basic",
      clone: () => {
        cloned = true;
        return {};
      },
    };
    const request = setup({
      fetcher: async () => response,
      open: () => cacheOpen.promise,
    });
    const event = request(destination);
    assert.equal(await event.response, response);
    assert.equal(cloned, true);
    assert.equal(event.pending.length, 1);
    cacheOpen.resolve({ put: () => put.promise });
    put.resolve();
    await Promise.all(event.pending);
  }
});

test("cache quota/open failures do not replace a successful network response", async () => {
  const response = { status: 200, type: "basic", clone: () => ({}) };
  const request = setup({
    fetcher: async () => response,
    open: async () => {
      throw new Error("quota");
    },
  });
  const event = request();
  assert.equal(await event.response, response);
  await Promise.all(event.pending);
});

test("offline documents and warm static assets keep the existing cache fallback", async () => {
  const cached = {};
  const offline = setup({
    fetcher: async () => {
      throw new Error("offline");
    },
    match: async () => cached,
  });
  assert.equal(await offline().response, cached);
  const warm = setup({
    fetcher: async () => assert.fail("unnecessary network"),
    match: async () => cached,
  });
  assert.equal(await warm("script").response, cached);
});
