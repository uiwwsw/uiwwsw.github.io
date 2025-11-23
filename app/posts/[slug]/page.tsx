import { notFound } from 'next/navigation';
import { getPostBySlug, getPostSlugs } from '@/lib/mdx';

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const post = await getPostBySlug(slug).catch(() => null);

  if (!post) return notFound();

  return (
    <article className="prose prose-invert prose-headings:scroll-m-20">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">MDX</p>
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
