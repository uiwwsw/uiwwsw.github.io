import { buildMetadata } from '@/lib/metadata';

const stack = ['Next.js', 'TypeScript', 'Zustand', 'React Query', 'PostgreSQL', 'tRPC', 'NextAuth', 'Vercel'];

const problemStatements = [
  {
    title: '선불 잔액을 안전하게 관리',
    detail:
      '이중출금, 부정 결제를 막기 위해 한도·잔액·세션 상태를 일관되게 동기화하고, 웹뷰에서도 은행급 보안 UX를 구현해야 했습니다.',
  },
  {
    title: 'KYC · 결제 심사 플로우 설계',
    detail:
      '본인인증, 한도 상향, 카드/계좌 등록 등 필수 단계를 끊김 없이 연결해 가입→충전→결제까지 하루 안에 완료하도록 목표를 세웠습니다.',
  },
  {
    title: '실험 가능한 결제 퍼널',
    detail:
      '기능 토글과 퍼널 계측을 결제/환불 API와 함께 설계해, 규제 이슈 없이도 온보딩·혜택 실험을 빠르게 배포해야 했습니다.',
  },
];

const flows = [
  {
    label: '가입·KYC',
    steps: [
      '휴대폰 본인인증 → 신분증 OCR → Face liveness 검증 후 JWT 세션 발급.',
      'NextAuth Credential Provider + Redis 세션 스토어로 웹/앱 토큰 동기화.',
      '인증 결과·리스크 스코어를 tRPC mutation으로 기록하고, 실패 시 재시도 쿼터를 관리.',
    ],
  },
  {
    label: '충전·결제',
    steps: [
      'PG 사전검증 → 가상계좌/카드 충전 → 잔액 스냅샷을 PostgreSQL에서 트랜잭션으로 기록.',
      '프론트는 React Query로 잔액 쿼리를 stale-while-revalidate로 유지, 실시간 알림은 SSE로 수신.',
      '두 번 클릭 방지: optimistic update는 허용하되, 결제 키 단위 idempotency 키를 백엔드에 전달.',
    ],
  },
  {
    label: '환불·CS',
    steps: [
      '사용자·관리자 콘솔을 같은 GraphQL 스키마로 노출해 환불/조정 API를 공유.',
      'SLA 이슈: 환불 지연 시 PagerDuty 알림, 서킷브레이커로 PG 타임아웃 시 즉시 롤백.',
      'CS 에이전트가 잔액/로그를 즉시 확인하도록 Kibana 링크를 UI에 임베드.',
    ],
  },
];

const implementationNotes = [
  {
    title: '보안/결제 설계',
    items: [
      'OAuth 2.1 + PKCE 기반 세션, MFA(푸시/OTP) 토글, Web Crypto로 민감 값 암호화 후 전송.',
      'PG Webhook을 Vercel Edge Function에서 수신해 일시적 트래픽 피크에도 지연을 최소화.',
      '한도/잔액은 Postgres serializable 트랜잭션과 idempotent mutation으로 중복 결제를 차단.',
    ],
  },
  {
    title: '데이터 · 상태 관리',
    items: [
      'React Query로 계좌/충전/거래 내역을 캐싱하고, SSE로 들어오는 이벤트마다 invalidate.',
      'Zustand 스토어에 UI 단위 상태(모달, 단계, 선택 카드)를 저장해 웹뷰/앱에서 공유.',
      '모노레포 패키지로 API 타입을 공유하고, Zod 스키마를 통해 런타임 검증·프런트 타입 추론을 통합.',
    ],
  },
  {
    title: '배포 · 운영',
    items: [
      'main 병합 시 Vercel Preview → QA 시나리오 통과 후 Production Promote, 주간 장애 리포트 자동 생성.',
      'Datadog RUM + Sentry로 결제 단계별 에러율을 트래킹, 로그 샘플은 BigQuery로 전송.',
      'Feature toggle(LaunchDarkly)로 혜택 배너, 충전 최소금액, 추가 인증 여부를 실험.',
    ],
  },
];

const learnings = [
  'KYC/결제처럼 규제된 도메인에서는 UX와 리스크를 함께 설계해야 하며, 규정 변경을 고려한 기능 토글이 필수임을 배웠습니다.',
  '잔액/한도 같은 핵심 상태는 서버 소스 오브 트루스로 고정하고, 프런트는 낙관적 UI를 제공하되 동기화를 체계화해야 합니다.',
  '웹뷰에서도 플랫폼 가이드라인(iOS/Android)을 지키는 접근성·보안 UX가 장기 유지보수 비용을 줄여줍니다.',
];

export const metadata = buildMetadata({
  title: '프리페이: Next 기반 선불 핀테크 결제 설계',
  description:
    'Next.js, React Query, tRPC로 선불 결제/환불 플로우를 설계하고 KYC·보안·상태 관리 전략을 정리한 케이스 스터디.',
});

export default function FreepayCaseStudy() {
  return (
    <div className="space-y-10 text-slate-100">
      <header className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-inner">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Case Study · Fintech</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 lg:max-w-3xl">
            <h1 className="text-3xl font-bold text-white lg:text-4xl">프리페이: Next 기반 결제/핀테크 온보딩</h1>
            <p className="text-base leading-relaxed text-slate-200">
              선불 잔액을 안전하게 관리하고, KYC·충전·결제·환불까지 이어지는 퍼널을 설계한 사례입니다.
              Next.js + React Query로 데이터 동기화와 보안 플로우를 단순화하고, 웹뷰·웹 모두 일관된 UX를 제공했습니다.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-200">
              {stack.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-800 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full max-w-sm space-y-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-200">
            {[{ label: '기간', value: '2021.03 - 2022.03' }, { label: '역할', value: '프런트엔드 리드 · PM' }, { label: '팀', value: 'FE 2 · BE 2 · 디자인 1' }].map((item) => (
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
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Problem Definition</p>
            <h2 className="text-2xl font-semibold text-white">핀테크 퍼널에서 풀어야 했던 문제</h2>
            <p className="text-slate-300">보안·규제 제약 속에서도 가입→충전→결제까지 빠르게 완주할 수 있는 흐름이 필요했습니다.</p>
          </div>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200">Risk · Conversion</span>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {problemStatements.map((item) => (
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
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Design & Flow</p>
            <h2 className="text-2xl font-semibold text-white">보안·결제 플로우 설계</h2>
            <p className="text-slate-300">KYC → 충전 → 결제 → 환불로 이어지는 주요 흐름을 Next.js와 백엔드 계약 기반으로 설계했습니다.</p>
          </div>
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">Trust · Reliability</span>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {flows.map((flow) => (
            <article key={flow.label} className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <h3 className="text-lg font-semibold text-white">{flow.label}</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                {flow.steps.map((step) => (
                  <li key={step} className="flex gap-2">
                    <span aria-hidden className="text-sky-300">↳</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Implementation</p>
            <h2 className="text-2xl font-semibold text-white">구현, 데이터, 상태 관리 전략</h2>
            <p className="text-slate-300">보안, 데이터 동기화, 운영을 다층으로 나눠 설계했습니다.</p>
          </div>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200">Next.js · tRPC · Observability</span>
        </header>
        <div className="grid gap-3 md:grid-cols-3">
          {implementationNotes.map((note) => (
            <article key={note.title} className="space-y-3 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-4 text-sm text-slate-200">
              <h3 className="text-base font-semibold text-white">{note.title}</h3>
              <ul className="space-y-2">
                {note.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-sky-300">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/50 p-6 shadow-inner">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Results & Learnings</p>
            <h2 className="text-2xl font-semibold text-white">역할, 기술 스택, 배운 점</h2>
            <p className="text-slate-300">핀테크 도메인에서의 역할과 주요 성과, 다음 프로젝트에 적용한 교훈을 정리했습니다.</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-100">Growth · Compliance</span>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <h3 className="text-base font-semibold text-white">역할</h3>
            <ul className="space-y-2 text-sm text-slate-200">
              {["프런트엔드 리드로 Next 앱 구조 설계, 디자인 시스템/모바일 웹뷰 대응.", 'PM 역할로 KYC·결제 퍼널 OKR 설정, 실험 계획·데이터 리포트 작성.', '보안 리뷰·PG사 협업, 로그/모니터링 파이프라인 연동.'].map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-emerald-300">✔</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <h3 className="text-base font-semibold text-white">기술 스택</h3>
            <p className="text-sm leading-relaxed text-slate-200">
              Next.js, React, TypeScript, tRPC, PostgreSQL, Redis, React Query, Zustand, NextAuth, Web Crypto, Sentry, Datadog RUM, LaunchDarkly, Vercel.
            </p>
          </article>
          <article className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <h3 className="text-base font-semibold text-white">배운 점</h3>
            <ul className="space-y-2 text-sm text-slate-200">
              {learnings.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-emerald-300">✔</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
