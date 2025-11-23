import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getPostSlugs } from '@/lib/mdx';
import { buildMetadata } from '@/lib/metadata';

export const dynamicParams = false;

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
  const url = `/posts/${params.slug}`;

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
  });
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) return notFound();

  return (
    <article className="prose prose-invert prose-headings:scroll-m-20">
      <header className="mb-8 rounded-2xl border border-slate-800/70 bg-slate-900/50 px-6 py-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">MDX</p>
        <h1 className="mb-3 text-4xl font-bold text-white">{post.frontmatter.title}</h1>
        {post.frontmatter.summary ? (
          <p className="text-lg text-slate-300">{post.frontmatter.summary}</p>
        ) : null}
        {post.frontmatter.date ? (
          <p className="mt-2 text-xs text-slate-400">Published {post.frontmatter.date}</p>
        ) : null}
      </header>
      <div className="space-y-6 text-slate-100">{post.content}</div>
    </article>
  );
}
