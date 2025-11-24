export const timeline = [
  {
    period: '2023.09 - 현재',
    role: '프런트엔드 리드 · 커머스/UGC',
    org: '찐리뷰',
    story:
      '실시간 후기와 크리에이터 제휴가 핵심인 커머스에서 상품/리뷰 노출을 RSC 기반으로 재설계해 캐싱 전략을 정교화했습니다.',
    achievements: [
      '서버 컴포넌트 + TanStack Query 하이브리드로 상품/콘텐츠 로드 42% 개선',
      '스토리북/Chromatic 워크플로로 릴리스 리드타임 30% 단축, 접근성 98점 유지',
      'A/B 실험 템플릿화로 온보딩·구매 전환 실험을 주 단위로 반복',
    ],
  },
  {
    period: '2022.04 - 2023.08',
    role: '프런트엔드 리드 · 여행 메타검색',
    org: '머랭트립',
    story:
      '도시/테마 추천과 검색을 결합한 메타검색에서 마이크로프런트엔드로 도메인을 분리하고 지도·동선 경험을 강화했습니다.',
    achievements: [
      'Next.js ISR + Algolia 프리페치로 인기 루트 초콜드 스타트 1.2s → 450ms',
      'PWA 오프라인 캐싱, 위치 추천 카드로 세션당 뷰 18% 증가',
      'Design Ops와 QA 스크립트를 자동화해 신규 지역 확장 주기를 단축',
    ],
  },
  {
    period: '2021.03 - 2022.03',
    role: '프런트엔드 · 핀테크 온보딩',
    org: '프리페이',
    story:
      '선불 결제와 멤버십 한도를 결합한 온보딩/정산 플로우를 설계하고, 운영 데이터 대시보드로 팀의 의사결정을 지원했습니다.',
    achievements: [
      '웹뷰/웹 공용 UI 킷으로 iOS·Android 하이브리드 속도와 일관성 확보',
      '기능 토글·실험 플래그로 정책 롤아웃을 안전하게 분리',
      'Looker Studio + BigQuery 파이프라인으로 실시간 KPI 모니터링',
    ],
  },
  {
    period: '2015 - 2021',
    role: '웹 퍼블리셔 → 프로덕트 엔지니어',
    org: '전자상거래·B2B SaaS',
    story:
      '에이전시와 SaaS를 오가며 리디자인, 반응형 접근성, 대규모 마이그레이션 프로젝트를 주도하며 프런트엔드 기반을 다졌습니다.',
    achievements: [
      '디자인 시스템·UI 키트를 만들어 팀 온보딩 시간을 수일에서 수시간으로 단축',
      '성능 예산을 도입해 번들 크기·LCP를 지속 모니터링하는 문화를 정착',
      'CS/세일즈와 합동 워크숍을 열어 요구사항을 사용자 여정으로 재정의',
    ],
  },
];

export const skillStacks = [
  {
    title: 'Frontend & Platform',
    description: 'RSC/SSR를 기본으로 한 제품 설계와 타입 세이프티, 실험 주기 단축을 중시합니다.',
    items: [
      'TypeScript, React, Next.js App Router, TanStack Query',
      'Storybook + Chromatic, Jest/Testing Library, Playwright',
      'Vite/TSUP 번들링, Turbo/Changeset으로 패키지 관리',
    ],
  },
  {
    title: 'Design System & DX',
    description: '접근성과 일관성, 배포 자동화를 모두 담은 디자인 시스템을 설계합니다.',
    items: [
      'Tailwind CSS, Radix UI, MDX 기반 문서화',
      'Figma Tokens, 디자인 토큰 파이프라인, 디자인 핸드오프 가이드',
      'ESLint/Prettier 공유 설정, 린트/포맷 pre-commit 워크플로',
    ],
  },
  {
    title: 'Data & Growth',
    description: '실험 설계와 모니터링을 기본값으로 두고, 사용자 행동을 빠르게 수집/학습합니다.',
    items: [
      'A/B 실험 플래그, 익스포저 로깅, 옵저버빌리티 대시보드',
      'GA4 + GTM, Amplitude, BigQuery/Looker Studio ETL',
      'KPI 트리 기반의 주간 리뷰와 리텐션/전환 퍼널 정리',
    ],
  },
];

export const principles = [
  {
    title: '사실 기반 서사',
    detail:
      '기능을 나열하기보다 지표와 제약을 맥락으로 묶어 스토리화합니다. 실험·모니터링 로그와 사용자 인터뷰를 근거로 삼습니다.',
  },
  {
    title: '디자인/성능/DX 균형',
    detail:
      '디자인 팀이 빠르게 움직이도록 시스템과 토큰을 제공하고, 성능 예산·번들 가드·프리페치로 속도를 확보합니다. DX 자동화로 반복 작업을 줄입니다.',
  },
  {
    title: '협업 우선 흐름',
    detail:
      '기획·CS·세일즈와 목적을 조율한 후 스토리맵을 그리고, PRD에 실패 가설과 롤백 시나리오를 명시합니다. QA 스크립트를 공유하고 회고를 문서화합니다.',
  },
  {
    title: '실험 가능한 구조',
    detail:
      '아키텍처 단계에서 플래그와 측정 지점을 설계해 안전하게 실험합니다. 데이터 레이어를 분리해 실험 중 단일화된 이벤트 스키마를 유지합니다.',
  },
];

export const englishSummary = [
  'Product-first frontend engineer with 9+ years of experience leading commerce, travel, and fintech teams.',
  'Design system advocate: balancing accessibility, performance budgets, and DX automation for reliable releases.',
  'Comfortable with RSC/SSR stacks, micro frontends, and data-informed experiments to hit conversion metrics.',
];
