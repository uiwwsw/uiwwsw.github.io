// Only ordinary web images are allowed. Never send credentials or render raw HTML.
export function imageSource(value, baseUrl) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function isArticleBlock(block) {
  if (!block || typeof block.fullSentence !== "string") return false;
  if (block.type === "image") {
    return (
      !!imageSource(block.src) &&
      (block.alt === undefined || typeof block.alt === "string")
    );
  }
  return block.type === "text" || block.type === "code";
}
