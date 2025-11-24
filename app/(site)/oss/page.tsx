import Link from 'next/link';
import { CodeSnippet } from './code-snippet';
import { ossPackages } from '@/content/oss-packages';

export const metadata = {
  title: 'Open Source / Libraries | UIWWSW',
  description: '스크롤, 모달, 캐러셀, 해시 동기화, React Query 헬퍼, 이스터에그 트리거 등 OSS 패키지를 문제-해결 포맷으로 소개합니다.',
};

export default function OssPage() {
  return (
    <div className="space-y-10 text-slate-100">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Open Source</p>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Open Source / Libraries</h1>
            <p className="max-w-3xl text-slate-300">
              ux-* 시리즈와 @uiwwsw 유틸을 문제-해결 포맷으로 정리했습니다. npm 설치, 짧은 사용 예시, GitHub·npm 링크를 함께 제공합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-700/70 bg-sky-500/10 px-4 py-3 text-sm text-slate-100">
            반응형 레이아웃: 1열(모바일) · 2열(≥768px) · 3열(≥1280px) 카드 그리드. 코드 스니펫은 가로 스크롤 가능.
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ossPackages.map((pkg) => (
          <article
            key={pkg.slug}
            className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-700/70"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">{pkg.title}</h2>
                  <p className="text-sm text-slate-300">{pkg.tagline}</p>
                </div>
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
                  USP
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-100">{pkg.usp}</p>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-200">
                {pkg.stack.map((item) => (
                  <span key={item} className="rounded-full border border-slate-800 px-2 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-sm text-slate-200">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">문제</p>
                <p className="text-slate-100">{pkg.problem}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">해결</p>
                <p className="text-slate-100">{pkg.solution}</p>
              </div>
            </div>

            <div className="space-y-3">
              <CodeSnippet label="npm 설치" code={pkg.install} />
              <CodeSnippet label="짧은 사용 예시" code={pkg.usage} />
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <Link
                href={pkg.repoUrl}
                target="_blank"
                className="rounded-full border border-slate-800 px-3 py-2 font-semibold underline-offset-4 transition hover:border-sky-700 hover:text-white"
              >
                Repo ↗
              </Link>
              <Link
                href={pkg.npmUrl}
                target="_blank"
                className="rounded-full border border-slate-800 px-3 py-2 font-semibold underline-offset-4 transition hover:border-sky-700 hover:text-white"
              >
                npm ↗
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Layout</p>
              <h3 className="text-2xl font-semibold text-white">반응형 카드 그리드 코드</h3>
              <p className="text-slate-300">실제 페이지가 사용하는 Tailwind 클래스를 그대로 보여줍니다.</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100">Responsive</span>
          </div>
          <div className="mt-4">
            <CodeSnippet
              label="레이아웃"
              code={`<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
  {/* 카드 컨텐츠 */}
</section>`}
            />
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Usage pattern</p>
          <h3 className="text-2xl font-semibold text-white">문제-해결 템플릿</h3>
          <p className="mt-2 text-slate-300">
            카드마다 문제 → 해결 → 설치/예시 순서로 반복해, 읽는 사람이 바로 USP와 사용법을 파악하도록 구성했습니다.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li>· 문제: 패키지가 해결하려는 반복 작업이나 리스크를 설명</li>
            <li>· 해결: 제공하는 컴포넌트/훅과 자동화 포인트를 명시</li>
            <li>· 설치/예시: npm 명령과 10줄 내외의 사용 예시 제공</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
