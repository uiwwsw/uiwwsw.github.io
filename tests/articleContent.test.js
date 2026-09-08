import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CONTENT_VERSION,
  canReuseContent,
  parseArticleBody,
  summarizeArticle,
  articleReadingTime,
} from "../scripts/lib/article-content.js";
import { imageSource, isArticleBlock } from "../src/utils/articleMedia.js";
import { createArticleLoader } from "../src/utils/articleLoader.js";

const base = "https://velog.io/@uiwwsw/photo";
const first = "https://velog.velcdn.com/images/photo.JPG";
const second = "https://velog.velcdn.com/images/photo(2).jpeg";

test("image-only and adjacent-image posts preserve every URL in source order", () => {
  const blocks = parseArticleBody(`![](${first})![](${second})`, base);
  assert.equal(blocks.length, 2);
  assert.ok(
    blocks.every((block) => block.type === "image" && isArticleBlock(block)),
  );
  assert.deepEqual(
    blocks.map((block) => block.src),
    [first, second],
  );
  assert.equal(summarizeArticle(blocks), "사진 2장으로 남긴 이야기");
  assert.equal(articleReadingTime(blocks), 1);
});

test("text, images, captions and code retain their order without sentence truncation", () => {
  const long = "사진 앞에 쓰는 긴 문장 ".repeat(50);
  const markdown = `${long}\n\n![여행 사진](${first})\n\n사진 설명\n\n\`\`\`js\nconst example = "![](${second})";\n\`\`\`\n\n짧다.`;
  const blocks = parseArticleBody(markdown, base);
  assert.deepEqual(
    blocks.map((block) => block.type),
    ["text", "image", "text", "code", "text"],
  );
  assert.equal(blocks[0].fullSentence, long.trim());
  assert.equal(blocks[1].alt, "여행 사진");
  assert.equal(blocks[2].fullSentence, "사진 설명");
  assert.equal(blocks[3].language, "js");
  assert.equal(blocks[4].fullSentence, "짧다.");
});

test("reference images, linked photos and HTML image attributes are extracted safely", () => {
  const markdown = `![참조 사진][photo]\n\n[![링크 사진](${second})](https://example.com/)\n\n<figure><img src="/images/photo.png?a=1&amp;b=2" alt="A &amp; B" onerror="alert(1)"><figcaption>캡션</figcaption></figure>\n\n[photo]: ${first}`;
  const blocks = parseArticleBody(markdown, base);
  assert.deepEqual(
    blocks.filter((block) => block.type === "image").map((block) => block.src),
    [first, second, "https://velog.io/images/photo.png?a=1&b=2"],
  );
  assert.equal(blocks[2].alt, "A & B");
  assert.equal(blocks[3].fullSentence, "캡션");
  assert.ok(!JSON.stringify(blocks).includes("onerror"));
});

test("dangerous protocols, credentials and active HTML are never reader media", () => {
  for (const src of [
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "file:///a.png",
    "http://example.com/a.png",
    "https://user:password@example.com/photo.png",
    "",
    null,
  ]) {
    assert.equal(imageSource(src), null);
    assert.equal(
      isArticleBlock({ type: "image", fullSentence: "image", src }),
      false,
    );
  }
  assert.deepEqual(
    parseArticleBody(
      '<script>alert(1)</script><style>body{display:none}</style><iframe src="https://example.com"></iframe><p>안전한 글</p><img src="javascript:alert(1)">',
      base,
    ),
    [{ type: "text", fullSentence: "안전한 글" }],
  );
  assert.equal(
    imageSource("//images.example.com/a.png", base),
    "https://images.example.com/a.png",
  );
  assert.equal(isArticleBlock(null), false);
});

test("old extraction caches are invalidated even when the remote source hash is unchanged", () => {
  const sentences = parseArticleBody(`![](${first})`, base);
  assert.equal(canReuseContent({ sentences, sourceHash: "same" }), false);
  assert.equal(
    canReuseContent({ sentences, contentVersion: CONTENT_VERSION - 1 }),
    false,
  );
  assert.equal(
    canReuseContent({ sentences, contentVersion: CONTENT_VERSION }),
    true,
  );
  assert.equal(
    canReuseContent({ sentences: [], contentVersion: CONTENT_VERSION }),
    false,
  );
  assert.equal(
    canReuseContent({ sentences: [null], contentVersion: CONTENT_VERSION }),
    false,
  );
});

test("the body loader accepts photos without requiring any text block", async () => {
  const sentences = parseArticleBody(`![](${first})`, base);
  const load = createArticleLoader(async () => ({
    ok: true,
    json: async () => ({ id: "photo", sentences }),
  }));
  assert.deepEqual(
    await load({ id: "photo", bodyUrl: "/photo.json" }),
    sentences,
  );
});

test("all restored real image posts have complete validated media blocks", () => {
  const source = JSON.parse(
    readFileSync(new URL("../src/data/velog-context.json", import.meta.url)),
  );
  const articles = Object.values(source);
  for (const article of articles) {
    assert.ok(canReuseContent(article));
    assert.ok(article.sentences.every(isArticleBlock));
  }
  // Media blocks must retain complete URLs, not shortened Markdown fragments.
  for (const article of articles)
    for (const block of article.sentences)
      if (block.type === "image") assert.equal(block.fullSentence, block.src);
});
