export async function collectPosts(fetchPage) {
  const posts = [];
  const ids = new Set();
  const cursors = new Set();
  let cursor = null;
  while (true) {
    const page = await fetchPage(cursor);
    if (!Array.isArray(page)) throw new Error("Invalid Velog page");
    if (!page.length) return posts;
    for (const post of page) {
      if (!post?.id || typeof post.url_slug !== "string")
        throw new Error("Invalid Velog post");
      if (!ids.has(post.id)) {
        ids.add(post.id);
        posts.push(post);
      }
    }
    const next = page.at(-1).id;
    if (cursors.has(next) || next === cursor)
      throw new Error(
        "Velog pagination repeated a cursor; refusing to save a partial archive",
      );
    cursors.add(next);
    cursor = next;
  }
}
