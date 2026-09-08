import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildCatalog } from "../src/utils/observatory.js";
import { extendRegistry } from "../src/utils/skyRegistry.js";
import { articleImage } from "../src/utils/seo.js";

const root = new URL("../", import.meta.url);
const registryPath = new URL("src/data/sky-registry.json", root);
const source = JSON.parse(
  await readFile(new URL("src/data/velog-context.json", root), "utf8"),
);
let previous;
try {
  previous = JSON.parse(await readFile(registryPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const registry = extendRegistry(source, previous);
const directory = new URL("public/data/articles/", root);
await mkdir(directory, { recursive: true });
const filenames = new Set();
const articles = [];
for (const article of buildCatalog(source)) {
  const body = JSON.stringify({ id: article.id, sentences: article.sentences });
  const hash = createHash("sha256").update(body).digest("hex");
  const filename = `${hash}.json`;
  filenames.add(filename);
  await writeFile(new URL(filename, directory), body);
  const {
    sentences,
    contentVersion,
    sourceHash,
    sourceETag,
    sourceModified,
    ...metadata
  } = article;
  articles.push({
    ...metadata,
    seoImage: articleImage(article),
    ...registry.stars[article.id],
    bodyUrl: `/data/articles/${filename}`,
  });
}
// Only remove this generator's obsolete, content-addressed outputs.
for (const name of await readdir(directory))
  if (/^[a-f0-9]{64}\.json$/.test(name) && !filenames.has(name))
    await unlink(new URL(name, directory));
await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
await writeFile(
  new URL("src/data/velog-index.json", root),
  JSON.stringify({ articles, sectors: registry.sectors }),
);
console.log(
  `Prepared ${articles.length} article bodies and ${registry.sectors.length} stable sectors (${fileURLToPath(directory)}).`,
);
