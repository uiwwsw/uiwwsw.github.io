import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8 text-slate-100">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Starter</p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Next.js 14 App Router + TypeScript + Tailwind CSS + MDX
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Use this base to kickstart a content-focused site. It ships with MDX
          loading utilities, a sample post, Tailwind styling, and sensible
          defaults for Vercel deployment.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/posts/hello-world"
            className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Read the sample post
          </Link>
          <Link
            href="/posts"
            className="rounded border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
          >
            Browse all posts
          </Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-xl font-semibold">MDX-first content</h2>
          <p className="text-slate-300">
            Drop MDX files in <code className="font-mono">/content</code> and
            they become routable via the helper loader.
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-xl font-semibold">Tailwind CSS ready</h2>
          <p className="text-slate-300">
            The Tailwind config scans the App Router, components, and MDX
            content out of the box.
          </p>
        </div>
      </section>
    </div>
  );
}
