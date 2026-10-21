import { fetch } from 'undici';
import { setTimeout as delay } from 'node:timers/promises';

// The old v2cdn host no longer serves a certificate for velog.io.
// Use Velog's API origin with normal TLS verification.
export const VELOG_GRAPHQL_URL = 'https://v2.velog.io/graphql';

export async function requestVelog(url, options = {}, {
  fetchImpl = fetch,
  sleep = delay,
  format = 'text',
} = {}) {
  const transientCodes = new Set([
    'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN',
    'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET',
  ]);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchImpl(url, {
        ...options,
        signal: AbortSignal.timeout(20000),
      });
      if (response.status === 304) return { response, data: null };
      if (!response.ok) {
        await response.body?.cancel();
        const error = new Error(`Velog request failed: HTTP ${response.status} (${url})`);
        error.retryable = response.status === 429 || response.status >= 500;
        const retryAfter = response.headers?.get('retry-after');
        if (retryAfter) {
          const seconds = Number(retryAfter);
          const waitMs = Number.isFinite(seconds)
            ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
          if (Number.isFinite(waitMs) && waitMs >= 0) {
            // Bound server-directed waits to keep the monthly job within its budget.
            error.retryAfterMs = Math.min(waitMs, 60000);
          }
        }
        throw error;
      }
      // Read the body inside the retry/timeout boundary as well.
      const data = format === 'json' ? await response.json() : await response.text();
      return { response, data };
    } catch (error) {
      const code = error.cause?.code || error.code || '';
      const tlsError = /CERT|TLS|SSL/.test(code);
      const retryable = error.retryable ?? (
        transientCodes.has(code) || error instanceof TypeError
        || ['TimeoutError', 'AbortError'].includes(error.name)
      );
      if (tlsError || !retryable || attempt === 2) {
        throw new Error(`Velog request failed (${url}): ${code || error.message}`, { cause: error });
      }
      console.warn(`Velog request retry ${attempt + 1}/2: ${url}`);
      await sleep(Math.max(1000 * 2 ** attempt, error.retryAfterMs || 0));
    }
  }
}
