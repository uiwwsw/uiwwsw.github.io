import { buildMetadata } from '@/lib/metadata';

const highlights = [
  {
    title: 'Ionic 하이브리드 전략',
    detail:
      '공통 UI를 Ionic으로 정의하고, 검색·결제와 같이 장치 기능이 필요 없는 화면은 웹뷰에 그대로 재사용. 네이티브 셸은 푸시/인앱 결제 권한만 담당해 마켓 심사 부담을 줄였습니다.',
  },
  {
    title: 'Cloudflare Static + API Edge 캐싱',
    detail:
      '여행 검색/추천을 SSG로 빌드해 Cloudflare Pages에 배포하고, Algolia 프리페치·지도 타일을 CDN 캐싱해 초회 응답을 260ms까지 줄였습니다.',
  },
  {
    title: '오프라인 · 불안정 네트워크 대응',
    detail:
      'IndexedDB에 최근 검색/찜을 저장하고, Service Worker가 로컬 가격 스냅샷을 제공하도록 구성해 지하철·기내 모드에서도 플래닝이 이어지게 했습니다.',
  },
];

const deliveryNotes = [
  '배포: main 병합 시 GitHub Actions → Cloudflare Pages로 정적 파일 배포, Capacitor 빌드는 주 단위로 스토어 제출.',
  '관찰: Cloudflare Analytics + Sentry를 연결해 웹뷰/웹 모두 동일한 에러 태깅, 지도 로딩/검색 TTI를 Real User Monitoring 지표로 수집.',
  '운영: 기능 토글(LaunchDarkly)로 추천 알고리즘, 가격 캐싱 TTL을 실험 단위로 조절. API 장애 시 로컬 스냅샷·대체 공급사 데이터로 폴백.',
];

const uxWins = [
  '검색-플랜-예약 흐름을 하단 탭과 단계별 챕터 카드로 설계해 평균 여정 길이를 5.2 → 3.8 화면으로 단축.',
  '항공/숙소/투어를 마이크로 프런트엔드로 분리하되, 지도/필터 UI를 공통 컴포넌트 라이브러리로 묶어 학습 비용을 낮춤.',
  '여행 시나리오 추천(주말 근교, 워케이션 등)을 캐러셀 + 저장 가능한 블록으로 제공해 찜-예약 전환율을 18%p 향상.',
  '가격 변동 알림을 푸시·이메일·인앱 배지로 통합 노출, 사용자가 선택한 채널 우선순위로 노이즈를 줄임.',
];

export const metadata = buildMetadata({
  title: '머랭트립: Ionic + Cloudflare Static 여행 케이스 스터디',
  description:
    'Ionic 하이브리드 셸과 Cloudflare Static 배포로 여행 검색/플래닝을 빠르게 제공하고, 오프라인·성능·운영까지 고려한 사례를 정리했습니다.',
});

export default function MeringuetripCaseStudy() {
  return (
    <div className="space-y-10 text-slate-100">
      <header className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-inner">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Case Study · Travel</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 lg:max-w-3xl">
            <h1 className="text-3xl font-bold text-white lg:text-4xl">머랭트립: 여행 검색·플래닝 하이브리드 앱</h1>
            <p className="text-base leading-relaxed text-slate-200">
              1) Ionic 기반 하이브리드 셸로 iOS/Android 웹뷰를 단일 코드로 유지하고, 2) Cloudflare Static + Edge 캐싱으로 여행 검색 속도를
              최적화했으며, 3) 오프라인·불안정 네트워크에서도 플래닝이 이어지도록 데이터를 설계한 프로젝트입니다.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-200">
              {['Ionic', 'Cloudflare Pages', 'Algolia', 'Capacitor', 'Service Worker', 'Design System'].map((tag) => (
                <span key={tag} className="rounded-full border border-slate-800 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full max-w-sm space-y-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-200">
            {[{ label: '기간', value: '2022.04 - 2023.08' }, { label: '역할', value: '프런트엔드 리드 · PM' }, { label: '팀', value: 'FE 3 · BE 2 · 디자인 1' }].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/50 px-3 py-2">
                <span className="text-xs uppercase tracking-[0.2em] text-sky-300">{item.label}</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Problem → Outcome</p>
            <h2 className="text-2xl font-semibold text-white">여행 메타검색을 빠르고 일관되게 만들기</h2>
            <p className="text-slate-300">검색-플랜-예약까지 끊기지 않는 흐름, 장치 제약을 최소화한 배포가 핵심 목표였습니다.</p>
          </div>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200">Fact based</span>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="space-y-2 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-5 shadow-sm transition hover:border-sky-700/60"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300">{item.title}</p>
              <p className="text-sm leading-relaxed text-slate-200">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-inner">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Architecture</p>
            <h2 className="text-2xl font-semibold text-white">Ionic + Cloudflare Static 조합의 설계 근거</h2>
            <p className="text-slate-300">하이브리드·정적 배포를 택한 이유와 시스템 흐름을 요약했습니다.</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">Performance · Offline</span>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <h3 className="text-lg font-semibold text-white">기술 선택 근거</h3>
            <ul className="space-y-2 text-sm text-slate-200">
              <li className="flex gap-2">
                <span aria-hidden className="text-sky-300">
                  •
                </span>
                <span>검색·추천 뷰는 빠른 릴리즈와 SEO가 필요해 SSR/SSG가 유리, Ionic은 네이티브 크롬을 재사용해 출시 주기를 단축.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-sky-300">
                  •
                </span>
                <span>Cloudflare Pages가 글로벌 PoP 캐싱과 Zero-Downtime 배포를 제공해 여행 트래픽 피크(금요일 오후)에도 안정적으로 유지.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-sky-300">
                  •
                </span>
                <span>Capacitor 플러그인으로 푸시/심박 센서 없이도 기본 인앱 결제, 푸시 토큰 동기화만 네이티브 코드에 한정.</span>
              </li>
            </ul>
          </article>
          <article className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <h3 className="text-lg font-semibold text-white">시스템 흐름</h3>
            <ul className="space-y-2 text-sm text-slate-200">
              <li className="flex gap-2">
                <span aria-hidden className="text-sky-300">↳</span>
                <span>클라이언트: Ionic UI → Service Worker(오프라인 캐시) → Algolia/내부 API 요청, 지도/이미지는 Cloudflare CDN에서 캐싱.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-sky-300">↳</span>
                <span>서버: Next.js SSG 빌드 → Cloudflare Pages 배포 → Edge에서 검색 결과 캐시(60초), 가격 API는 stale-while-revalidate.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="text-sky-300">↳</span>
                <span>관측: Web Vitals와 지도 타일 로딩 시간을 로그로 수집, 슬로우 쿼리는 Edge Function 로그를 통해 Slack 알림.</span>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">UX Wins</p>
            <h2 className="text-2xl font-semibold text-white">여행 사용자 흐름을 위한 UI/UX 하이라이트</h2>
            <p className="text-slate-300">검색→추천→예약 단계에서 마찰을 줄이기 위해 실험·리서치로 검증한 패턴입니다.</p>
          </div>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200">Conversion</span>
        </header>
        <div className="grid gap-3 md:grid-cols-2">
          {uxWins.map((item) => (
            <article
              key={item}
              className="flex gap-3 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-4 text-sm text-slate-200 shadow-sm"
            >
              <span aria-hidden className="text-sky-300">
                •
              </span>
              <p className="leading-relaxed">{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-inner">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Delivery & Ops</p>
            <h2 className="text-2xl font-semibold text-white">배포, 성능, 오프라인 운영 메모</h2>
            <p className="text-slate-300">하이브리드 앱을 안정적으로 유지하기 위해 배포 파이프라인과 관측 포인트를 설계했습니다.</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">SLA · 안정성</span>
        </header>
        <ul className="space-y-2 text-sm text-slate-200">
          {deliveryNotes.map((note) => (
            <li key={note} className="flex gap-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3">
              <span aria-hidden className="text-emerald-300">✔</span>
              <span className="leading-relaxed">{note}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
