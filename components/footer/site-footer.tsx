import Link from 'next/link';

const footerLinks = [
  { href: '/blog', label: '블로그 모아보기' },
  { href: 'mailto:hello@example.com', label: '이메일' },
  { href: 'https://github.com/uiwwsw', label: 'GitHub', external: true },
  { href: 'https://nextjs.org', label: 'Next.js', external: true },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 py-10 text-sm text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-12 lg:px-6">
        <div className="lg:col-span-7">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-300">UIWWSW</p>
          <p className="mt-2 text-lg font-semibold text-white">Next.js App Router Starter</p>
          <p className="mt-3 max-w-xl text-slate-400">
            모바일 퍼스트 내비게이션과 접근성 친화적 포맷을 갖춘 공용 레이아웃입니다. MDX, Tailwind, SEO 베이스를 바로
            사용해 보세요.
          </p>
        </div>
        <div className="lg:col-span-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {footerLinks.map((link) => (
              <div key={link.href} className="flex flex-col">
                <Link
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noreferrer' : undefined}
                  className="rounded-md px-2 py-1 font-semibold text-slate-100 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  {link.label}
                  {link.external ? (
                    <span aria-hidden className="text-xs text-slate-500">
                      ↗
                    </span>
                  ) : null}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-800 px-3 py-2 font-semibold text-slate-100 transition hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Twitter
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-800 px-3 py-2 font-semibold text-slate-100 transition hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              LinkedIn
            </a>
            <a
              href="tel:+821012345678"
              className="rounded-md border border-slate-800 px-3 py-2 font-semibold text-slate-100 transition hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              010-1234-5678
            </a>
          </div>
        </div>
      </div>
      <div className="mt-8 px-4 text-center text-xs text-slate-500 lg:px-6">
        © {new Date().getFullYear()} UIWWSW. 빌드와 배포는 Next.js로.
      </div>
    </footer>
  );
}
