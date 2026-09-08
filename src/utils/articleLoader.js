import { isArticleBlock } from "./articleMedia.js";

export function createArticleLoader(
  fetcher = (...args) => fetch(...args),
  capacity = 12,
) {
  const cache = new Map();
  return async (article, signal) => {
    const key = article.bodyUrl;
    if (cache.has(key)) {
      const body = cache.get(key);
      cache.delete(key);
      cache.set(key, body);
      return body;
    }
    const response = await fetcher(key, { signal });
    if (!response.ok)
      throw new Error(`Article request failed: ${response.status}`);
    const body = await response.json();
    if (
      !body ||
      body.id !== article.id ||
      !Array.isArray(body.sentences) ||
      body.sentences.some((sentence) => !isArticleBlock(sentence))
    )
      throw new Error("Invalid article body");
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    cache.set(key, body.sentences);
    if (cache.size > capacity) cache.delete(cache.keys().next().value);
    return body.sentences;
  };
}
