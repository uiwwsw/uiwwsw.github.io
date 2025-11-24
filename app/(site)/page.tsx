import Link from 'next/link';
import { getAllPosts } from '@/lib/mdx';

const highlightedProjects = [
  {
    title: '찐리뷰',
    subtitle: 'UGC 리뷰 커머스 프런트엔드 리드',
    timeframe: '2023.09 - 현재',
    summary:
      '실시간 후기와 크리에이터 제휴가 핵심인 커머스. 디자인 시스템을 리빌드하고 서버 컴포넌트 기반의 상품/리뷰 노출 속도를 42% 개선했습니다.',
    highlights: [
      'Next.js App Router + TanStack Query로 상품/콘텐츠 하이브리드 SSR 구성',
      '장바구니·주문 플로우의 Lighthouse 웹 접근성 98점 달성',
      '크리에이터 스튜디오용 스토리북/Chromatic 워크플로 도입으로 배포 시간 30% 단축',
    ],
  },
  {
    title: '머랭트립',
    subtitle: '여행 메타검색 · 시나리오 추천',
    timeframe: '2022.04 - 2023.08',
    summary:
      '도시·테마·동선 추천을 묶은 검색 경험을 설계했습니다. 오프라인 캐싱과 지도 뷰 최적화로 체류 시간을 늘리고 예약 전환을 올렸습니다.',
    highlights: [
      'React 기반 마이크로프런트엔드로 항공/숙소/투어 검색 도메인 분리',
      'Next.js ISR + Algolia 프리페치로 인기 루트 초콜드 스타트 1.2s → 450ms',
      'PWA 오프라인 캐싱과 위치 기반 추천 카드로 세션당 뷰 18% 증가',
    ],
  },
  {
    title: '프리페이',
    subtitle: '선불형 핀테크 온보딩',
    timeframe: '2021.03 - 2022.03',
    summary:
      '간편결제와 사전 충전 모델을 결합한 서비스. 본인인증/한도 관리 플로우를 구축하고 KPI를 모니터링하는 운영 도구를 만들었습니다.',
    highlights: [
      '웹뷰·웹 공용 UI 킷을 설계해 iOS/Android 하이브리드 속도를 맞춤',
      '프로파일·한도 정책을 기능 토글로 분리해 신규 실험 배포 주 2회 유지',
      'Looker Studio + BigQuery 파이프라인으로 실시간 대시보드 제공',
    ],
  },
];

const ossPackages = [
  {
    name: '@uiwwsw/eslint-config',
    description: 'Next.js/RSC 팀을 위한 의견ated 룰셋. 접근성과 import 정리를 기본값으로 제공합니다.',
    link: 'https://www.npmjs.com/package/@uiwwsw/eslint-config',
    tags: ['eslint', 'rsc', 'a11y'],
  },
  {
    name: '@uiwwsw/remark-reading-time',
    description: 'MDX에서 읽기 시간을 계산해 frontmatter로 주입하는 Remark 플러그인.',
    link: 'https://www.npmjs.com/package/@uiwwsw/remark-reading-time',
    tags: ['mdx', 'remark'],
  },
  {
    name: '@uiwwsw/prettier-config',
    description: '단일 패키지로 포맷/정렬 일관성을 유지하는 공유 Prettier 설정.',
    link: 'https://www.npmjs.com/package/@uiwwsw/prettier-config',
    tags: ['prettier', 'monorepo'],
  },
];

const introBadges = [
  'Product Engineer · Frontend',
  'Design System',
  'Growth Experiment',
  'OSS Maintainer',
];

type ProjectCardProps = (typeof highlightedProjects)[number];

export default async function HomePage() {
  const posts = await getAllPosts();
  const latestPosts = posts.slice(0, 3);

  return (
    <div className="space-y-10 text-slate-100">
      <Hero />

      <section className="space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Highlighted Work</p>
            <h2 className="text-3xl font-bold text-white">최근 리드한 프로젝트</h2>
            <p className="max-w-2xl text-slate-300">
              커머스, 여행, 핀테크 도메인에서 제품 목표를 지표로 연결하고, 디자인 시스템과 실험 문화로 속도를 냈습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-slate-800 px-3 py-1">Lead Frontend</span>
            <span className="rounded-full border border-slate-800 px-3 py-1">Design Ops</span>
            <span className="rounded-full border border-slate-800 px-3 py-1">Experiment</span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          {highlightedProjects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300">OSS</p>
              <h3 className="text-2xl font-semibold text-white">@uiwwsw 패키지</h3>
              <p className="text-slate-300">
                프로젝트마다 반복되는 설정을 패키지화하고, 콘텐츠 워크플로를 단순화하는 플러그인을 유지보수합니다.
              </p>
            </div>
            <span className="hidden rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200 lg:inline-flex">MIT</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {ossPackages.map((pkg) => (
              <article
                key={pkg.name}
                className="group rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4 transition hover:-translate-y-1 hover:border-sky-700/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={pkg.link}
                    target="_blank"
                    className="text-sm font-semibold text-white underline-offset-4 hover:text-sky-200"
                  >
                    {pkg.name}
                  </Link>
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">pkg</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{pkg.description}</p>
                <div className="mt-3 flex flex-wrap gap-1 text-[11px] text-slate-200">
                  {pkg.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-800 px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Latest</p>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-white">블로그 프리뷰</h3>
            <Link
              href="/posts"
              className="text-sm font-medium text-sky-200 underline-offset-4 hover:text-sky-100"
            >
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {latestPosts.length === 0 ? (
              <p className="text-sm text-slate-400">아직 게시된 글이 없습니다. 실험 기록을 곧 올릴게요.</p>
            ) : (
              latestPosts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-2xl border border-slate-800/70 bg-slate-950/50 p-4 transition hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/posts/${post.slug}`}
                        className="text-base font-semibold text-white underline-offset-4 hover:text-sky-200"
                      >
                        {post.frontmatter.title}
                      </Link>
                      {post.frontmatter.summary ? (
                        <p className="mt-1 text-sm text-slate-300">{post.frontmatter.summary}</p>
                      ) : null}
                    </div>
                    {post.frontmatter.date ? (
                      <span className="whitespace-nowrap text-[11px] uppercase tracking-wide text-slate-400">
                        {post.frontmatter.date}
                      </span>
                    ) : null}
                  </div>
                  {post.frontmatter.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-200">
                      {post.frontmatter.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-slate-800 px-2 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-900 via-slate-900/60 to-slate-950 p-8 shadow-lg">
      <div className="absolute inset-0 opacity-50 blur-3xl" aria-hidden>
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-sky-500/20" />
        <div className="absolute bottom-0 right-6 h-56 w-56 rounded-full bg-indigo-500/10" />
      </div>
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4 lg:max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Intro</p>
          <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            안녕하세요, 제품을 끝까지 책임지는 프런트엔드 엔지니어 우승우(uiwwsw)입니다.
          </h1>
          <p className="max-w-3xl text-lg text-slate-200">
            커머스·여행·핀테크 서비스에서 사용자 흐름을 빠르게 검증하고, 디자인 시스템과 데이터 도구로 팀 전체가 학습 속도를 유지하도록 돕습니다. RSC, 타입 세이프 API, 실험 자동화를 즐깁니다.
          </p>
          <div className="flex flex-wrap gap-2">
            {introBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1 text-xs text-slate-100">
                {badge}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <Link
              href="https://github.com/uiwwsw"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950 shadow transition hover:bg-sky-400"
            >
              GitHub 보기
            </Link>
            <Link
              href="mailto:uiwwsw@gmail.com"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-4 py-2 font-semibold text-slate-100 transition hover:border-slate-600"
            >
              협업 문의
            </Link>
          </div>
        </div>

        <div className="grid w-full max-w-sm gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-200 shadow-inner">
          <HighlightRow label="현재 역할" value="프런트엔드/프로덕트 엔지니어 (커머스·콘텐츠)" />
          <HighlightRow label="최근 관심" value="RSC 데이터 경로, 성능 예산, 실험 자동화" />
          <HighlightRow label="선호 스택" value="TypeScript · Next.js · Tailwind CSS · tRPC · Vercel" />
          <HighlightRow label="일하는 방식" value="문제 정의 → 프로토 → 계측 → 실험/배포 → 회고" />
        </div>
      </div>
    </section>
  );
}

function HighlightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <p className="text-sm text-slate-100">{value}</p>
    </div>
  );
}

function ProjectCard({ title, subtitle, timeframe, summary, highlights }: ProjectCardProps) {
  return (
    <article className="group flex h-full flex-col gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-700/70">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-sky-300">{timeframe}</p>
          <h3 className="mt-1 text-2xl font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-300">{subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200">Case</span>
      </div>
      <p className="text-sm text-slate-200">{summary}</p>
      <ul className="space-y-2 text-sm text-slate-300">
        {highlights.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-400" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
