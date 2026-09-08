// Imported only by Vite's development branch. Never published as real writing.
import { extendRegistry } from "./skyRegistry.js";
import { buildCatalog } from "./observatory.js";

export function makeStressCatalog(index, count) {
  const source = {};
  const stars = {};
  index.articles.forEach((article, i) => {
    source[i] = article;
    stars[article.id] = {
      position: article.position,
      sectorId: article.sectorId,
      legacyId: article.legacyId,
    };
  });
  for (let i = index.articles.length; i < count; i++) {
    const base = index.articles[i % index.articles.length];
    const id = `test-star-${i}`;
    source[i] = {
      ...base,
      id,
      slug: id,
      title: `[TEST ${i}] ${base.title}`,
      publishedAt: `${2027 + Math.floor(i / 800)}-01-01`,
      bodyUrl: `data:application/json,${encodeURIComponent(JSON.stringify({ id, sentences: [{ type: "text", fullSentence: "성능 검증용 가상 기록입니다. 실제 글에는 포함되지 않습니다." }] }))}`,
    };
  }
  const registry = extendRegistry(source, {
    version: 1,
    sectors: index.sectors,
    stars,
  });
  const articles = buildCatalog(source).map(({ sentences, ...article }) => ({
    ...article,
    ...registry.stars[article.id],
  }));
  return { articles, sectors: registry.sectors };
}
