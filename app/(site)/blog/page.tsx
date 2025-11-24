import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/mdx';
import { buildMetadata } from '@/lib/metadata';

const POSTS_PER_PAGE = 5;

export const metadata: Metadata = buildMetadata({
  title: '블로그',
  description: 'MDX frontmatter 메타데이터, 읽기 시간, 코드/TOC 스타일이 적용된 블로그 템플릿입니다.',
});

type BlogPageProps = {
  searchParams?: { page?: string };
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const pageParam = Number(searchParams?.page ?? '1');
  const requestedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const allPosts = await getAllPosts();
  const totalPages = Math.max(1, Math.ceil(allPosts.length / POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const posts = allPosts.slice(start, start + POSTS_PER_PAGE);

  return (
    <div className="space-y-10 text-slate-100">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Blog</p>
        <h1 className="text-3xl font-bold text-white lg:text-4xl">MDX 블로그 아카이브</h1>
        <p className="max-w-3xl text-slate-300">
          <span className="font-mono text-sky-200">/content/posts/*.mdx</span> 의 frontmatter를 읽어 목록/페이지네이션을 생성합니다.
          읽기 시간·태그·목차가 자동 적용된 템플릿을 확인해 보세요.
        </p>
      </header>

      <div className="space-y-4">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-sm transition hover:-translate-y-1 hover:border-sky-700/60"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="rounded-sm text-white underline-offset-4 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    {post.frontmatter.title}
                  </Link>
                </h2>
                {post.frontmatter.summary ? (
                  <p className="text-slate-300">{post.frontmatter.summary}</p>
                ) : null}
                {post.frontmatter.tags?.length ? (
                  <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-slate-200">
                    {post.frontmatter.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-800 px-3 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                {post.frontmatter.date ? <span>{post.frontmatter.date}</span> : null}
                <span aria-hidden>•</span>
                <span>{post.readingMinutes}분 읽기</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {totalPages > 1 ? (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      ) : null}
    </div>
  );
}

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <nav aria-label="블로그 페이지네이션" className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
      <Link
        href={currentPage > 1 ? `/blog?page=${currentPage - 1}` : '#'}
        aria-disabled={currentPage === 1}
        className="rounded-md px-3 py-2 font-semibold transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        ← 이전
      </Link>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        Page {currentPage} / {totalPages}
      </p>
      <Link
        href={currentPage < totalPages ? `/blog?page=${currentPage + 1}` : '#'}
        aria-disabled={currentPage === totalPages}
        className="rounded-md px-3 py-2 font-semibold transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        다음 →
      </Link>
    </nav>
  );
}
