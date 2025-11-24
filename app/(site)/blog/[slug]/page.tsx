import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPostSlugs } from '@/lib/mdx';
import { buildMetadata, siteMetadata } from '@/lib/metadata';

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug).catch(() => null);

  if (!post) {
    return buildMetadata({ title: '포스트를 찾을 수 없어요' });
  }

  const title = post.frontmatter.title || 'Post';
  const description = post.frontmatter.summary || 'MDX 포스트 상세 페이지입니다.';
  const url = `/blog/${params.slug}`;

  return buildMetadata({
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.frontmatter.date,
    },
    twitter: {
      title,
      description,
    },
    alternates: {
      canonical: `${siteMetadata.siteUrl}${url}`,
    },
  });
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const post = await getPostBySlug(slug).catch((error) => {
    console.error('블로그 포스트 로딩에 실패했습니다.', slug, error);
    return null;
  });

  if (!post) return notFound();

  const { frontmatter, headings, readingMinutes } = post;

  return (
    <article className="space-y-8 text-slate-100">
      <header className="space-y-3 rounded-3xl border border-slate-800/70 bg-slate-900/60 px-6 py-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">MDX</p>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">{frontmatter.title}</h1>
          {frontmatter.summary ? <p className="text-lg text-slate-300">{frontmatter.summary}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          {frontmatter.date ? (
            <>
              <time dateTime={frontmatter.date}>{frontmatter.date}</time>
              <span aria-hidden>•</span>
            </>
          ) : null}
          <span>{readingMinutes}분 읽기</span>
          {frontmatter.tags?.length ? (
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-200">
              {frontmatter.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-800 px-2 py-1">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
        <div className="prose prose-invert prose-headings:scroll-m-24 prose-p:text-slate-200 prose-li:text-slate-200 max-w-none break-words">
          {post.content}
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">On this page</p>
          {headings.length ? (
            <nav className="space-y-2 text-sm text-slate-200">
              {headings.map((heading) => (
                <a
                  key={heading.slug}
                  href={`#${heading.slug}`}
                  className={`block rounded-md px-3 py-2 transition hover:bg-slate-900/60 hover:text-white ${
                    heading.depth === 3 ? 'pl-6 text-slate-300' : 'font-semibold'
                  }`}
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          ) : (
            <p className="text-sm text-slate-400">표시할 목차가 없습니다.</p>
          )}
          <p className="text-xs text-slate-500">
            h2/h3 헤딩이 자동으로 anchor와 함께 목차에 반영됩니다.
          </p>
        </aside>
      </div>
    </article>
  );
}
