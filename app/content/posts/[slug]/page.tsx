import { redirect } from 'next/navigation';

export default function RedirectContentPost({ params }: { params: { slug: string } }) {
  const normalizedSlug = params.slug.replace(/\.mdx$/, '');
  return redirect(`/blog/${normalizedSlug}`);
}
