import clsx from 'clsx';
import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { Fragment } from 'react';
import type { ReactElement, ReactNode } from 'react';

function anchorize(id?: string) {
  return id ? `#${id}` : undefined;
}

function unwrapAutolink(children: ReactNode): ReactNode {
  if (!children || typeof children !== 'object') return children;

  if ('props' in (children as any) && (children as any).type === 'a') {
    return (children as any).props.children;
  }

  return children;
}

const headingBase = 'scroll-m-20 font-semibold text-white tracking-tight';

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => <h1 className={clsx(headingBase, 'mb-6 text-4xl')}>{children}</h1>,
  h2: ({ id, children }) => {
    const content = unwrapAutolink(children);
    return (
      <h2 id={id} className={clsx(headingBase, 'mt-12 mb-4 flex items-center gap-2 text-2xl')}>
        <a
          href={anchorize(id)}
          className="group inline-flex items-center gap-2 text-white no-underline"
          aria-label={`섹션 ${content} 링크`}
        >
          <span>{content}</span>
          <span className="text-base text-slate-500 opacity-0 transition group-hover:opacity-100">#</span>
        </a>
      </h2>
    );
  },
  h3: ({ id, children }) => {
    const content = unwrapAutolink(children);
    return (
      <h3 id={id} className={clsx(headingBase, 'mt-8 mb-3 flex items-center gap-2 text-xl text-slate-100')}>
        <a
          href={anchorize(id)}
          className="group inline-flex items-center gap-2 text-slate-100 no-underline"
          aria-label={`섹션 ${content} 링크`}
        >
          <span>{content}</span>
          <span className="text-sm text-slate-500 opacity-0 transition group-hover:opacity-100">#</span>
        </a>
      </h3>
    );
  },
  p: ({ children }) => <p className="mb-5 leading-relaxed text-slate-200">{children}</p>,
  a: ({ href = '', children }) => (
    <Link
      href={href}
      className="font-semibold text-sky-200 underline decoration-sky-500/50 underline-offset-4 transition hover:text-sky-100"
    >
      {children}
    </Link>
  ),
  strong: ({ children }) => <strong className="text-white">{children}</strong>,
  ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6 text-slate-200">{children}</ul>,
  ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6 text-slate-200">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-4 border-sky-600/70 bg-slate-900/60 px-4 py-3 text-slate-100">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-slate-800" />,
  code: ({ children }) => (
    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[13px] text-sky-200">{children}</code>
  ),
  pre: ({ children }) => {
    if (!children || typeof children !== 'object' || !('props' in (children as any))) {
      return <pre className="rounded-2xl bg-slate-900/80 p-4 text-sm text-slate-100">{children}</pre>;
    }

    const child = children as ReactElement<{ className?: string; children?: string }>;
    const language = child.props.className?.replace('language-', '').toUpperCase() || 'CODE';
    const code = child.props.children;

    return (
      <div className="my-6 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/60 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/70 bg-slate-900/60 px-4 py-2 text-[11px] uppercase tracking-[0.15em] text-slate-400">
          <span>{language}</span>
          <span>Code</span>
        </div>
        <pre className="overflow-x-auto px-4 py-3 text-sm leading-7 text-slate-100">
          <code className="font-mono text-[13px] leading-7">{code}</code>
        </pre>
      </div>
    );
  },
  table: ({ children }) => (
    <div className="my-6 overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/50">
      <table className="w-full text-left text-sm text-slate-100">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-300">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-800/80">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-slate-900/40">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-4 py-3 text-slate-200">{children}</td>,
  inlineCode: ({ children }) => (
    <code className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[13px] text-sky-200">{children}</code>
  ),
  Fragment,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
