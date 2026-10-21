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


test('honors Retry-After seconds and dates with a bounded wait', async () => {
  for (const [header, expected] of [['12', 12000], ['999', 60000], ['invalid', 1000]]) {
    let calls = 0;
    const waits = [];
    await requestVelog(url, {}, {
      fetchImpl: async () => ++calls === 1
        ? new Response('', { status: 429, headers: { 'Retry-After': header } })
        : new Response('ok'),
      sleep: async (ms) => waits.push(ms),
    });
    assert.deepEqual(waits, [expected]);
  }
  let calls = 0;
  const waits = [];
  await requestVelog(url, {}, {
    fetchImpl: async () => ++calls === 1
      ? new Response('', { status: 503, headers: { 'Retry-After': new Date(Date.now() + 30000).toUTCString() } })
      : new Response('ok'),
    sleep: async (ms) => waits.push(ms),
  });
  assert.ok(waits[0] > 28000 && waits[0] <= 30000);
});

test('retries transport errors while reading a response body', async () => {
  let calls = 0;
  const result = await requestVelog(url, {}, {
    fetchImpl: async () => ({
      ok: true,
      text: async () => {
        if (++calls === 1) throw Object.assign(new Error('socket closed'), { code: 'ECONNRESET' });
        return 'complete article';
      },
    }),
    sleep: async () => {},
  });
  assert.equal(calls, 2);
  assert.equal(result.data, 'complete article');
});
