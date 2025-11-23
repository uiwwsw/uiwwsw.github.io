'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/posts', label: '포스트' },
  {
    href: 'https://nextjs.org/docs/app',
    label: '문서',
    external: true,
  },
];

function NavLink({
  href,
  label,
  isActive,
  external,
  onNavigate,
}: {
  href: string;
  label: string;
  isActive: boolean;
  external?: boolean;
  onNavigate?: () => void;
}) {
  const baseClasses =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400';

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={
        baseClasses +
        (isActive
          ? ' bg-slate-800/70 text-white shadow-sm ring-1 ring-slate-700'
          : ' text-slate-200 hover:bg-slate-800/40 hover:text-white')
      }
      onClick={onNavigate}
    >
      {label}
      {external ? (
        <span aria-hidden className="text-xs text-slate-400">
          ↗
        </span>
      ) : null}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const activeHref = useMemo(() => {
    if (pathname === '/') return '/';
    if (pathname?.startsWith('/posts')) return '/posts';
    return pathname;
  }, [pathname]);

  const close = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/70 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-lg font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400"
        >
          <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
            UIWWSW
          </span>
          <span className="text-base text-slate-200">Starter Kit</span>
        </Link>

        <nav aria-label="주 메뉴" className="hidden md:flex md:items-center md:gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              isActive={activeHref === link.href}
              onNavigate={close}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-200 shadow-sm transition hover:border-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="sr-only">모바일 메뉴 토글</span>
            <div className="space-y-1.5">
              <span
                className={`block h-0.5 w-6 rounded-full bg-current transition-transform ${isOpen ? 'translate-y-2 rotate-45' : ''}`}
              />
              <span className={`block h-0.5 w-6 rounded-full bg-current ${isOpen ? 'opacity-0' : ''}`} />
              <span
                className={`block h-0.5 w-6 rounded-full bg-current transition-transform ${isOpen ? '-translate-y-2 -rotate-45' : ''}`}
              />
            </div>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'} fixed inset-0 z-20 bg-slate-950/70 backdrop-blur transition-opacity md:hidden`}
        aria-hidden={!isOpen}
        onClick={close}
      >
        <div
          className="absolute inset-y-0 right-0 w-80 max-w-[80%] border-l border-slate-800 bg-slate-900 px-4 py-6 shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-300">메뉴</p>
            <button
              type="button"
              className="rounded-md p-2 text-slate-300 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              onClick={close}
            >
              <span className="sr-only">닫기</span>
              ✕
            </button>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                {...link}
                isActive={activeHref === link.href}
                onNavigate={close}
              />
            ))}
          </div>
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">빠른 연락</p>
            <p className="mt-2">문의는 언제든 환영합니다. 아래 링크를 확인하세요.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="mailto:hello@example.com"
                className="rounded-md bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                이메일 보내기
              </a>
              <a
                href="https://github.com/uiwwsw"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
