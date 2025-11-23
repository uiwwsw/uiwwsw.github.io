import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/mdx';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Posts',
  description: 'Browse MDX posts sourced from the content directory.',
});

export default async function PostsPage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-8 text-slate-100">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Archive</p>
        <h1 className="text-3xl font-bold text-white lg:text-4xl">모든 포스트</h1>
        <p className="max-w-2xl text-slate-300">
          MDX 파일을 <code className="font-mono">/content</code> 에 추가하면 정적 경로로 자동 변환됩니다. RSC 파이프라인으로
          타입 세이프하게 불러옵니다.
        </p>
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm transition hover:border-slate-700"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-white">
                <Link
                  href={`/posts/${post.slug}`}
                  className="rounded-sm text-white underline-offset-4 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
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
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                {post.frontmatter.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-800 px-3 py-1">
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
