export type OssPackage = {
  slug: string;
  title: string;
  tagline: string;
  usp: string;
  problem: string;
  solution: string;
  install: string;
  usage: string;
  repoUrl: string;
  npmUrl: string;
  stack: string[];
};

export const ossPackages: OssPackage[] = [
  {
    slug: 'ux-scroll',
    title: 'ux-scroll',
    tagline: '스크롤 인터랙션을 선언적으로 구성',
    usp: 'scroll-linked 애니메이션과 스티키 네비게이션을 hook 하나로.',
    problem: 'IntersectionObserver와 throttle 코드를 매번 새로 짜며 스크롤 상태 동기화가 번거롭다.',
    solution:
      'useScrollProgress 훅과 ScrollSection 컴포넌트로 진행률, 고정 헤더, parallax 효과를 prop만으로 설정합니다.',
    install: 'npm install ux-scroll',
    usage: `import { ScrollSection, useScrollProgress } from 'ux-scroll';

function LandingHero() {
  const progress = useScrollProgress();

  return (
    <ScrollSection id="hero" pin stickyHeader>
      <div style={{ opacity: progress.hero }}>영웅 섹션</div>
    </ScrollSection>
  );
}`,
    repoUrl: 'https://github.com/uiwwsw/ux-scroll',
    npmUrl: 'https://www.npmjs.com/package/ux-scroll',
    stack: ['React Hook', 'Scroll-linked', 'SSR Safe'],
  },
  {
    slug: 'ux-dialog',
    title: 'ux-dialog',
    tagline: '접근성 우선 모달/드로어',
    usp: 'Focus trap, aria 속성을 기본값으로 제공하는 zero-style 컴포넌트.',
    problem: '모달마다 aria-label, 포커스 이동, 바디 스크롤 잠금을 반복 구현해야 한다.',
    solution:
      'Dialog.Root/Trigger/Content 구성요소에 기본 a11y 속성과 포커스 트랩이 포함되어 있어 스타일만 입히면 된다.',
    install: 'npm install ux-dialog',
    usage: `import { Dialog } from 'ux-dialog';

export function ConfirmButton() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>삭제</Dialog.Trigger>
      <Dialog.Content title="정말 삭제할까요?">
        <p>이 동작은 되돌릴 수 없습니다.</p>
        <Dialog.Actions>
          <Dialog.Close>취소</Dialog.Close>
          <Dialog.Confirm onConfirm={() => doDelete()}>삭제</Dialog.Confirm>
        </Dialog.Actions>
      </Dialog.Content>
    </Dialog.Root>
  );
}`,
    repoUrl: 'https://github.com/uiwwsw/ux-dialog',
    npmUrl: 'https://www.npmjs.com/package/ux-dialog',
    stack: ['A11y', 'Focus Trap', 'ARIA'],
  },
  {
    slug: 'ux-carousel',
    title: 'ux-carousel',
    tagline: '콘텐츠에 집중한 캐러셀',
    usp: '터치/키보드 네비게이션과 접근성 레이블을 내장.',
    problem: '슬라이드 이동, 루프, 자동 재생 옵션을 일관되게 설정하기 어렵다.',
    solution:
      'CarouselProvider 하나로 autoplay, loop, breakpoints를 설정하고, Carousel.Item이 role과 label을 자동 부여한다.',
    install: 'npm install ux-carousel',
    usage: `import { Carousel } from 'ux-carousel';

export function Showcase({ items }) {
  return (
    <Carousel.Provider autoplay interval={4000} breakpoints={{ 768: 2, 1024: 3 }}>
      <Carousel.Viewport>
        {items.map((item) => (
          <Carousel.Item key={item.id}>
            <img src={item.thumb} alt={item.title} />
          </Carousel.Item>
        ))}
      </Carousel.Viewport>
      <Carousel.Dots />
    </Carousel.Provider>
  );
}`,
    repoUrl: 'https://github.com/uiwwsw/ux-carousel',
    npmUrl: 'https://www.npmjs.com/package/ux-carousel',
    stack: ['Responsive', 'Autoplay', 'Keyboard'],
  },
  {
    slug: 'ux-hash',
    title: 'ux-hash',
    tagline: '해시 기반 UI 동기화 헬퍼',
    usp: 'URL hash를 form, 탭, 스크롤 상태와 양방향 동기화.',
    problem: '페이지 내 이동 시 hash/scroll 위치가 뒤섞이고, 상태 공유가 어렵다.',
    solution:
      'useHashState 훅으로 hash를 상태처럼 다루고, HashAnchor 컴포넌트로 스무스 스크롤과 포커스를 제어한다.',
    install: 'npm install ux-hash',
    usage: `import { HashAnchor, useHashState } from 'ux-hash';

export function TabSection() {
  const [tab, setTab] = useHashState('tab', 'overview');

  return (
    <div>
      <nav>
        <button onClick={() => setTab('overview')}>개요</button>
        <button onClick={() => setTab('api')}>API</button>
      </nav>
      <HashAnchor id={tab} offset={64}>
        <section>{tab === 'overview' ? '요약' : 'API 상세'}</section>
      </HashAnchor>
    </div>
  );
}`,
    repoUrl: 'https://github.com/uiwwsw/ux-hash',
    npmUrl: 'https://www.npmjs.com/package/ux-hash',
    stack: ['URL State', 'Smooth Scroll', 'Tabs'],
  },
  {
    slug: 'react-query-helper',
    title: '@uiwwsw/react-query-helper',
    tagline: '서버 상태 패턴 모음',
    usp: 'prefetch, suspense-safe fetcher, 에러 폴리시를 한곳에.',
    problem: 'React Query 세팅마다 fetcher/캐시키 규칙이 달라 코드베이스가 불안정하다.',
    solution:
      'createQueryHelper로 fetcher/warmup 규약을 정의하고, prefetchToJSON으로 RSC에서도 캐시를 주입한다.',
    install: 'npm install @uiwwsw/react-query-helper',
    usage: `import { createQueryHelper } from '@uiwwsw/react-query-helper';

const query = createQueryHelper({
  baseUrl: '/api',
  defaultOptions: { staleTime: 60_000 },
});

export const useUser = (id: string) =>
  query.useQuery(['user', id], ({ fetchJson }) => fetchJson('/users/' + id));
`,
    repoUrl: 'https://github.com/uiwwsw/react-query-helper',
    npmUrl: 'https://www.npmjs.com/package/@uiwwsw/react-query-helper',
    stack: ['React Query', 'RSC Safe', 'Prefetch'],
  },
  {
    slug: 'easter-egg',
    title: '@uiwwsw/easter-egg',
    tagline: '경량 이스터에그 트리거',
    usp: '키보드·터치 제스처·패턴을 하나의 hook으로 감지.',
    problem: '특별한 키 입력이나 터치 제스처를 감지하기 위한 이벤트 로직을 매번 복붙한다.',
    solution:
      'useEasterEgg 훅으로 konami, 키 시퀀스, 두 번 탭 등 트리거를 선언적으로 등록한다.',
    install: 'npm install @uiwwsw/easter-egg',
    usage: `import { useEasterEgg } from '@uiwwsw/easter-egg';

export function HiddenMessage() {
  useEasterEgg({ sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown'] }, () => alert('🎉')); 
  return <p>몰래 준비한 기능을 찾아보세요.</p>;
}`,
    repoUrl: 'https://github.com/uiwwsw/easter-egg',
    npmUrl: 'https://www.npmjs.com/package/@uiwwsw/easter-egg',
    stack: ['Hook', 'Gesture', 'Keyboard'],
  },
];
