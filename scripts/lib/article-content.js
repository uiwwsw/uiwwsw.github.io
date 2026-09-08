import { marked } from "marked";
import { load } from "cheerio";
import { imageSource, isArticleBlock } from "../../src/utils/articleMedia.js";

// Bump when extraction changes, so HTTP validators cannot reuse an old lossy body.
export const CONTENT_VERSION = 2;

export function canReuseContent(article) {
  return (
    article?.contentVersion === CONTENT_VERSION &&
    Array.isArray(article.sentences) &&
    article.sentences.length > 0 &&
    article.sentences.every(isArticleBlock)
  );
}

// Convert Markdown to inert, typed reading blocks at build time. No HTML is
// shipped to or executed by the reader. Marked handles adjacent/reference images,
// escaped characters and parentheses in image URLs before any text cleanup.
export function parseArticleBody(markdown, baseUrl) {
  const $ = load(marked.parse(markdown, { gfm: true, breaks: true }));
  $(
    "script, style, iframe, object, embed, svg, math, template, noscript",
  ).remove();
  const blocks = [];
  let text = "";
  const flush = () => {
    const fullSentence = text.trim();
    if (fullSentence) blocks.push({ type: "text", fullSentence });
    text = "";
  };
  const boundaries = new Set([
    "p",
    "div",
    "section",
    "article",
    "figure",
    "figcaption",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "ul",
    "ol",
    "tr",
    "hr",
  ]);
  function visit(node) {
    if (node.type === "text") {
      text += node.data;
      return;
    }
    if (node.type !== "tag") return;
    const name = node.name.toLowerCase();
    if (name === "img") {
      flush();
      const src = imageSource($(node).attr("src"), baseUrl);
      if (src)
        blocks.push({
          type: "image",
          fullSentence: src,
          src,
          alt: $(node).attr("alt") || "",
        });
      return;
    }
    if (name === "pre") {
      flush();
      const code = $(node).find("code").first();
      const fullSentence = (code.length ? code.text() : $(node).text()).replace(
        /\n$/,
        "",
      );
      if (fullSentence.trim())
        blocks.push({
          type: "code",
          fullSentence,
          language:
            /(?:^|\s)language-([^\s]+)/.exec(code.attr("class") || "")?.[1] ||
            null,
        });
      return;
    }
    if (name === "br") {
      text += "\n";
      return;
    }
    if (boundaries.has(name)) flush();
    for (const child of node.children || []) visit(child);
    if (name === "td" || name === "th") text += "\t";
    if (boundaries.has(name)) flush();
  }
  for (const node of $("body").contents().toArray()) visit(node);
  flush();
  return blocks;
}

export function summarizeArticle(blocks) {
  const prose = blocks
    .filter((block) => block.type === "text")
    .map((block) => block.fullSentence)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (prose)
    return prose.length > 180 ? `${prose.slice(0, 177).trim()}...` : prose;
  const photos = blocks.filter((block) => block.type === "image").length;
  if (photos) return `사진 ${photos}장으로 남긴 이야기`;
  return blocks.some((block) => block.type === "code")
    ? "코드로 남긴 이야기"
    : "";
}

export function articleReadingTime(blocks) {
  const words = blocks
    .filter((block) => block.type === "text")
    .map((block) => block.fullSentence)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
