import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Next.js App Router Starter',
  description: 'TypeScript + Tailwind CSS + MDX base on Next.js App Router.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="border-b border-slate-800 bg-slate-950">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-sm font-medium text-slate-200">
            <Link href="/" className="text-lg font-semibold text-white">
              Next.js Starter
            </Link>
            <div className="flex gap-4">
              <Link href="/posts">Posts</Link>
              <Link href="https://nextjs.org/docs/app" target="_blank" rel="noreferrer">
                Docs
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
