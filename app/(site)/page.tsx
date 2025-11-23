import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-10 text-slate-100">
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/70 p-8 shadow-lg backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Starter</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
          Next.js 14 App Router + TypeScript + Tailwind CSS + MDX
        </h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-300">
          모바일 퍼스트 내비게이션과 공용 레이아웃을 갖춘 스타터입니다. MDX 로딩 유틸, 샘플 포스트, 접근성 포커스 링, 기본
          SEO/OG 템플릿을 포함합니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/posts/hello-world"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            샘플 포스트 읽기
          </Link>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            모든 포스트 보기
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-semibold">MDX-first content</h2>
          <p className="mt-2 text-slate-300">
            Drop MDX files in <code className="font-mono">/content</code> and they become routable via the helper loader.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-xl font-semibold">Tailwind CSS ready</h2>
          <p className="mt-2 text-slate-300">
            The Tailwind config scans the App Router, components, and MDX content out of the box.
          </p>
        </div>
      </section>
    </div>
  );
}
