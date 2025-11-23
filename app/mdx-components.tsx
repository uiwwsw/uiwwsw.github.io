import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => <h1 className="mb-6 text-4xl font-bold">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="mt-10 mb-3 text-2xl font-semibold" id={String(children)}>
      {children}
    </h2>
  ),
  p: ({ children }) => <p className="mb-4 leading-relaxed text-slate-200">{children}</p>,
  a: ({ href = '', children }) => (
    <Link href={href} className="text-blue-400 underline underline-offset-4">
      {children}
    </Link>
  ),
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5">{children}</ol>,
  code: ({ children }) => (
    <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-blue-200">{children}</code>
  ),
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
