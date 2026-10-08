import test from 'node:test';
import assert from 'node:assert/strict';
import { requestVelog, VELOG_GRAPHQL_URL } from '../scripts/lib/velog-request.js';

const url = VELOG_GRAPHQL_URL;
test('Velog origin request retries transient HTTP failures and consumes JSON', async () => {
  const delays = [];
  const responses = [new Response('busy', { status: 503 }), new Response('slow', { status: 429 }), Response.json({ data: { posts: [] } })];
  const result = await requestVelog(url, { method: 'POST', body: '{}' }, {
    format: 'json', sleep: async ms => delays.push(ms),
    fetchImpl: async (target, options) => {
      assert.equal(target, 'https://v2.velog.io/graphql');
      assert.equal(options.method, 'POST');
      assert.ok(options.signal instanceof AbortSignal);
      return responses.shift();
    },
  });
  assert.deepEqual(result.data, { data: { posts: [] } });
  assert.deepEqual(delays, [1000, 2000]);
});
test('connection failures exhaust a bounded retry budget', async () => {
  let attempts = 0;
  await assert.rejects(requestVelog(url, {}, {
    sleep: async () => {}, fetchImpl: async () => {
      attempts++;
      throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
    },
  }), /ECONNRESET/);
  assert.equal(attempts, 3);
});
test('certificate errors, permanent HTTP errors and invalid JSON fail without retry', async () => {
  for (const fail of [
    () => { throw new TypeError('fetch failed', { cause: { code: 'ERR_TLS_CERT_ALTNAME_INVALID' } }); },
    () => new Response('missing', { status: 404 }),
    () => new Response('not json'),
  ]) {
    let attempts = 0;
    await assert.rejects(requestVelog(url, {}, {
      format: 'json', sleep: async () => assert.fail('must not retry'),
      fetchImpl: async () => { attempts++; return fail(); },
    }));
    assert.equal(attempts, 1);
  }
});
test('conditional article requests preserve 304 cache reuse', async () => {
  const result = await requestVelog(url, {}, {
    fetchImpl: async () => new Response(null, { status: 304 }),
  });
  assert.equal(result.response.status, 304);
  assert.equal(result.data, null);
});
test('body stream failures are retried too', async () => {
  let attempts = 0;
  const result = await requestVelog(url, {}, {
    sleep: async () => {}, fetchImpl: async () => {
      if (attempts++ === 0) return { ok: true, text: async () => { throw new TypeError('terminated'); } };
      return new Response('article');
    },
  });
  assert.equal(result.data, 'article');
  assert.equal(attempts, 2);
});
