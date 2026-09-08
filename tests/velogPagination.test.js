import test from "node:test";
import assert from "node:assert/strict";
import { collectPosts } from "../scripts/lib/velog-pagination.js";

const post = (i) => ({ id: String(i), url_slug: `post-${i}` });
test("pagination collects beyond 1,000 posts until an empty terminal page", async () => {
  const all = Array.from({ length: 3000 }, (_, i) => post(i));
  const result = await collectPosts(async (cursor) =>
    all.slice(
      cursor === null ? 0 : Number(cursor) + 1,
      (cursor === null ? 0 : Number(cursor) + 1) + 20,
    ),
  );
  assert.deepEqual(result, all);
});
test("overlapping pages deduplicate articles without losing their order", async () => {
  const pages = [[post(1), post(2)], [post(2), post(3)], []];
  assert.deepEqual(await collectPosts(async () => pages.shift()), [
    post(1),
    post(2),
    post(3),
  ]);
});
test("repeated and cyclic cursors fail rather than silently save a partial archive", async () => {
  await assert.rejects(
    collectPosts(async () => [post(1)]),
    /repeated a cursor/,
  );
  let page = 0;
  await assert.rejects(
    collectPosts(async () => [post(page++ % 2)]),
    /repeated a cursor/,
  );
});
test("malformed responses fail; an empty account returns an empty list", async () => {
  await assert.rejects(
    collectPosts(async () => null),
    /Invalid Velog page/,
  );
  await assert.rejects(
    collectPosts(async () => [{ id: "1" }]),
    /Invalid Velog post/,
  );
  assert.deepEqual(await collectPosts(async () => []), []);
});
