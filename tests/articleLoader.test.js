import test from "node:test";
import assert from "node:assert/strict";
import { createArticleLoader } from "../src/utils/articleLoader.js";

const article = (id) => ({ id, bodyUrl: `/${id}.json` });
const success = (id) => ({
  ok: true,
  json: async () => ({ id, sentences: [{ fullSentence: id, type: "text" }] }),
});

test("body loader reuses a bounded LRU cache and forwards cancellation", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const load = createArticleLoader(async (url, options) => {
    calls.push(url);
    assert.equal(options.signal, signal);
    return success(url.slice(1, -5));
  }, 2);
  for (const id of ["a", "b", "a", "c", "a", "b"])
    await load(article(id), signal);
  assert.deepEqual(calls, ["/a.json", "/b.json", "/c.json", "/b.json"]);
});

test("failed and invalid responses can be retried without caching errors", async () => {
  const replies = [
    { ok: false, status: 404 },
    success("wrong-id"),
    { ok: true, json: async () => ({ id: "a", sentences: [{}] }) },
    success("a"),
  ];
  const load = createArticleLoader(async () => replies.shift());
  await assert.rejects(load(article("a")), /404/);
  await assert.rejects(load(article("a")), /Invalid/);
  await assert.rejects(load(article("a")), /Invalid/);
  assert.equal((await load(article("a")))[0].fullSentence, "a");
});

test("aborted responses never enter the cache", async () => {
  let calls = 0;
  const controller = new AbortController();
  const load = createArticleLoader(async () => {
    calls++;
    return success("a");
  });
  controller.abort();
  await assert.rejects(load(article("a"), controller.signal), {
    name: "AbortError",
  });
  await load(article("a"));
  assert.equal(calls, 2);
});
