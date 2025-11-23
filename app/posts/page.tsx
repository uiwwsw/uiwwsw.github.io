import Link from 'next/link';
import { getAllPosts } from '@/lib/mdx';

export const metadata = {
  title: 'Posts',
  description: 'Browse MDX posts sourced from the content directory.',
};

export default async function PostsPage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-8 text-slate-100">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Posts</h1>
        <p className="text-slate-300">
          MDX files in <code className="font-mono">/content</code> are compiled
          at build time via the RSC MDX pipeline.
        </p>
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                <Link href={`/posts/${post.slug}`} className="text-blue-300 hover:text-blue-100">
                  {post.frontmatter.title}
                </Link>
              </h2>
              {post.frontmatter.date ? (
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {post.frontmatter.date}
                </span>
              ) : null}
            </div>
            {post.frontmatter.summary ? (
              <p className="mt-2 text-slate-300">{post.frontmatter.summary}</p>
            ) : null}
            {post.frontmatter.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                {post.frontmatter.tags.map((tag) => (
                  <span key={tag} className="rounded bg-slate-800 px-2 py-1">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
