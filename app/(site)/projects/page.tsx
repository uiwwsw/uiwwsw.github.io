"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';

type ProjectType = 'product' | 'case-study' | 'oss';

type ProjectMeta = {
  slug: string;
  title: string;
  subtitle: string;
  timeframe: string;
  summary: string;
  tags: string[];
  type: ProjectType;
  ctaLabel: string;
  href: string;
  featured?: boolean;
};

const projects: ProjectMeta[] = [
  {
    slug: 'jinreview',
    title: '찐리뷰',
    subtitle: 'UGC 리뷰 커머스 프런트엔드 리드',
    timeframe: '2023.09 - 현재',
    summary:
      '실시간 후기, 제휴 크리에이터 스튜디오, 관리자 도구를 한 UI킷으로 묶고 RSC 기반 상품 노출 성능을 끌어올린 프로젝트.',
    tags: ['Commerce', 'Design System', 'SSR', 'Growth'],
    type: 'product',
    ctaLabel: '프로젝트 상세',
    href: '/posts/jinreview',
    featured: true,
  },
  {
    slug: 'meringuetrip',
    title: '머랭트립',
    subtitle: '여행 메타검색 · 시나리오 추천',
    timeframe: '2022.04 - 2023.08',
    summary:
      'Ionic 하이브리드 셸 + Cloudflare Static 배포로 여행 검색을 빠르게 제공하고, Algolia 프리페치와 지도 캐싱으로 전환율을 올린 사례.',
    tags: ['Travel', 'Ionic', 'Static', 'Algolia'],
    type: 'case-study',
    ctaLabel: '케이스 스터디',
    href: '/projects/meringuetrip',
    featured: true,
  },
  {
    slug: 'prefay',
    title: '프리페이',
    subtitle: '선불형 핀테크 온보딩',
    timeframe: '2021.03 - 2022.03',
    summary:
      '본인인증/한도 관리, 기능 토글 기반 실험, 하이브리드 앱 UI킷을 구축해 신규 가입 플로우를 빠르게 실험했습니다.',
    tags: ['Fintech', 'Webview', 'Feature Toggle'],
    type: 'case-study',
    ctaLabel: '케이스 스터디',
    href: '/posts/prefay',
  },
  {
    slug: 'design-systems',
    title: 'Design System Ops',
    subtitle: '멀티 브랜드 UI 킷 + Chromatic 워크플로',
    timeframe: '2023',
    summary:
      '스토리북·Chromatic을 통한 비주얼 회귀 테스트와 Figma 토큰 싱크로 배포 시간을 줄인 디자인 시스템 운영 사례.',
    tags: ['Design System', 'DX', 'Automation'],
    type: 'product',
    ctaLabel: '워크플로 보기',
    href: '/posts/design-system-ops',
  },
  {
    slug: 'oss-eslint',
    title: '@uiwwsw/eslint-config',
    subtitle: 'RSC + a11y 우선 린터 프리셋',
    timeframe: '2024',
    summary: 'RSC, 접근성, import 정리에 특화된 린트 규칙 모음. 다수 프로젝트에서 바로 사용 가능한 npm 패키지.',
    tags: ['OSS', 'ESLint', 'RSC'],
    type: 'oss',
    ctaLabel: '패키지 보기',
    href: 'https://www.npmjs.com/package/@uiwwsw/eslint-config',
  },
  {
    slug: 'oss-remark',
    title: '@uiwwsw/remark-reading-time',
    subtitle: '읽기 시간 계산 MDX 플러그인',
    timeframe: '2024',
    summary: 'MDX frontmatter에 읽기 시간을 주입하는 Remark 플러그인. 콘텐츠 워크플로를 단순화합니다.',
    tags: ['OSS', 'MDX', 'Remark'],
    type: 'oss',
    ctaLabel: '패키지 보기',
    href: 'https://www.npmjs.com/package/@uiwwsw/remark-reading-time',
  },
  {
    slug: 'growth-experiments',
    title: 'Growth Experiment Kit',
    subtitle: '기능 토글 + 퍼널 계측 템플릿',
    timeframe: '2022 - 2024',
    summary:
      'Experiment.js, Amplitude 계측, 실험용 UI 컴포넌트를 번들로 관리해 릴리즈 주기를 단축한 내부 템플릿.',
    tags: ['Growth', 'Analytics', 'DX'],
    type: 'product',
    ctaLabel: '구성 살펴보기',
    href: '/posts/growth-experiments',
  },
];

const typeOptions: { label: string; value: ProjectType | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: 'Product', value: 'product' },
  { label: 'Case Study', value: 'case-study' },
  { label: 'OSS', value: 'oss' },
];

export default function ProjectsPage() {
  const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((project) => project.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => (typeFilter === 'all' ? true : project.type === typeFilter))
      .filter((project) => (tagFilter ? project.tags.includes(tagFilter) : true))
      .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
  }, [tagFilter, typeFilter]);

  return (
    <div className="space-y-10 text-slate-100">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Projects</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">모든 프로젝트 & 케이스 스터디</h1>
            <p className="max-w-3xl text-slate-300">
              제품 리드, 실험 템플릿, OSS 패키지를 한 곳에 모았습니다. 유형과 태그로 필터링하고 카드에서 각 프로젝트 상세로 이동할 수
              있습니다. 3열 그리드(모바일 1열, 태블릿 2열)로 정렬해 중요한 프로젝트는 상단에 고정합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
            반응형: 1열 (≤640px) · 2열 (≥768px) · 3열 (≥1024px), featured 카드 우선 정렬.
          </div>
        </div>
      </header>

      <FilterBar
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        tagFilter={tagFilter}
        onTagChange={setTagFilter}
        tags={tags}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </section>
    </div>
  );
}

type FilterBarProps = {
  typeFilter: ProjectType | 'all';
  onTypeChange: (type: ProjectType | 'all') => void;
  tagFilter: string | null;
  onTagChange: (tag: string | null) => void;
  tags: string[];
};

function FilterBar({ typeFilter, onTypeChange, tagFilter, onTagChange, tags }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onTypeChange(option.value)}
            className={`rounded-full border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              typeFilter === option.value
                ? 'border-sky-500/70 bg-sky-500/10 text-sky-100'
                : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-slate-200">
        <button
          onClick={() => onTagChange(null)}
          className={`rounded-full border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            tagFilter === null
              ? 'border-sky-500/70 bg-sky-500/10 text-sky-100'
              : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:text-white'
          }`}
        >
          모든 태그
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onTagChange(tag)}
            className={`rounded-full border px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-sky-400/70 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              tagFilter === tag
                ? 'border-sky-500/70 bg-sky-500/10 text-sky-100'
                : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

type ProjectCardProps = {
  project: ProjectMeta;
};

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article
      className={`relative flex h-full flex-col gap-3 rounded-3xl border bg-slate-900/60 p-5 shadow-sm transition hover:-translate-y-1 hover:border-sky-700/70 ${
        project.featured ? 'border-sky-700/70' : 'border-slate-800/70'
      }`}
    >
      {project.featured ? (
        <span className="absolute right-4 top-4 rounded-full bg-sky-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-100">
          Featured
        </span>
      ) : null}

      <div className="space-y-1 pr-16">
        <p className="text-[12px] uppercase tracking-[0.2em] text-slate-400">{project.timeframe}</p>
        <h3 className="text-xl font-semibold text-white">{project.title}</h3>
        <p className="text-sm text-slate-200">{project.subtitle}</p>
      </div>

      <p className="text-sm leading-relaxed text-slate-300">{project.summary}</p>

      <div className="mt-auto flex flex-wrap gap-2 text-[11px] text-slate-200">
        {project.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-slate-800 px-2 py-1">
            {tag}
          </span>
        ))}
      </div>

      <Link
        href={project.href}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-sky-200 underline-offset-4 hover:text-sky-100"
      >
        {project.ctaLabel}
        <span className="transition group-hover:translate-x-1">→</span>
      </Link>
    </article>
  );
}
