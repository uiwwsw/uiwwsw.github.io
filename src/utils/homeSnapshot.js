// Only the visible landing content is needed to keep the first paint stable.
// Do not inline the whole catalog: the sky may grow to thousands of articles.
export function createHomeSnapshot(articles) {
  const featured =
    articles.find((article) => article.topic === "essay") || articles[0];
  return {
    articleCount: articles.length,
    latestEssay: featured
      ? { id: featured.id, slug: featured.slug, title: featured.title }
      : null,
  };
}
