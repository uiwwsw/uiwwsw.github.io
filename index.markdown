---
layout: default
title: Matthew Yoon — 윤창원
---

<div class="container">
  <section id="profile" class="hero">
    <div class="hero__lead">
      <p class="hero__eyebrow">윤창원 · Matthew Yoon</p>
      <h1 class="hero__title">타입세이프한 인터랙션과 자동화를 동시에 몰아가는 TypeScript Interaction Engineer.</h1>
      <p class="hero__subtitle">React · Vue에서 상태 전이를 설계하고, 반복되는 의사결정은 CLI와 코드 생성으로 자동화합니다. 입력 난제와 DX 파이프라인을 하나의 스토리로 묶어 팀이 <strong>몰입</strong>과 <strong>속도</strong>를 동시에 획득하도록 설계합니다.</p>
      <ul class="hero__meta" aria-label="현재 작업 요약">
        <li><span class="badge badge--live">Live Build</span> React Query scaffolder와 Typedoc 워크플로를 Changesets로 자동 배포.</li>
        <li><span class="badge badge--mono">Focus</span> 한국어 IME 제어 가상 키보드와 Scene Graph 기반 인터랙션 엔진.</li>
      </ul>
      <div class="hero__actions" role="group" aria-label="바로 가기">
        <a class="button" href="#projects">최근 빌드 살펴보기</a>
        <a class="button button--ghost" href="https://velog.io/@uiwwsw" target="_blank" rel="noopener">Velog에서 읽기</a>
      </div>
    </div>
    <div class="hero__code" aria-hidden="true">
      <div class="code-card">
        <header class="code-card__header">
          <span>app/hero.tsx</span>
          <span class="code-card__status">build ✅</span>
        </header>
        <pre class="code-card__body"><code>import { createScene } from '@matthew/interaction-kit';

type HeroCTAProps = {
  focus: 'interaction' | 'automation';
};

export const HeroCTA = ({ focus }: HeroCTAProps) => {
  const scene = createScene({
    focus,
    onShip: deploy('typed-ux'),
  });

  return (
    &lt;Stack spacing={12}&gt;
      &lt;HeroHeading&gt;Type safe delivery&lt;/HeroHeading&gt;
      &lt;Button variant="accent" onClick={scene.launch}&gt;
        Ship immersive UX
      &lt;/Button&gt;
    &lt;/Stack&gt;
  );
};</code></pre>
      </div>
    </div>
    <div class="hero__grid" role="list">
      <article class="hero__card" role="listitem">
        <div class="hero__card-head">
          <span class="badge">Core Loop</span>
          <h3>Interaction &amp; Automation</h3>
        </div>
        <p>상태 전이를 스토리보드처럼 모델링하고, CLI로 반복 작업을 자동화해 프로덕트 실험 속도를 올립니다.</p>
        <p class="hero__note">스토리텔링과 빌드 파이프라인을 같은 레포에서 관리합니다.</p>
      </article>
      <article class="hero__card" role="listitem">
        <div class="hero__card-head">
          <span class="badge">Systems</span>
          <h3>IME · 입력 시스템</h3>
        </div>
        <p>한국어 조합, Pointer, MIDI 이벤트까지 제어하는 입력 파이프라인을 직접 구축해 어려운 UX를 타입으로 보장합니다.</p>
        <p class="hero__note">Virtual Keyboard Guard · Composition Orchestrator</p>
      </article>
      <article class="hero__card" role="listitem">
        <div class="hero__card-head">
          <span class="badge">Stack</span>
          <ul class="pill-list">
            <li>TypeScript 5.x</li>
            <li>React · Vue</li>
            <li>TanStack Query</li>
            <li>Bun · pnpm · Changesets</li>
          </ul>
        </div>
        <p class="hero__note">DX 실험은 모두 mono-repo 템플릿과 CI recipe로 재배포합니다.</p>
      </article>
    </div>
  </section>

  <section id="highlights" class="section">
    <h2 class="section__title">Key Signals</h2>
    <p class="section__intro">인터랙션 난제 해결과 DX 자동화를 동시에 밀어붙인 대표 사례를 모듈 카드로 정리했습니다.</p>
    <div class="signal-grid" role="list">
      <article class="signal-card" role="listitem">
        <header>
          <span class="badge badge--mono">virtual-keyboard</span>
          <h3>한국어 IME 난제 해결</h3>
        </header>
        <p>Composition 이벤트와 커스텀 키보드를 하나의 상태 머신으로 통제해 모바일 네이티브 키보드가 개입할 여지를 제거했습니다.</p>
        <ul class="signal-meta">
          <li>React 가상 키보드</li>
          <li>IME Latency Guard</li>
          <li>Storybook + Typedoc 배포</li>
        </ul>
      </article>
      <article class="signal-card" role="listitem">
        <header>
          <span class="badge badge--mono">react-query-helper</span>
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          <h3>DX 자동화</h3>
        </header>
        <p>OpenAPI 스키마만으로 React Query 훅·옵션·테스트를 scaffold하는 CLI를 제작해 팀 캐싱 전략을 코드 생성으로 표준화했습니다.</p>
        <ul class="signal-meta">
          <li>Watch Mode Scaffold</li>
          <li>Bun · pnpm 지원</li>
          <li>Changesets 릴리스</li>
        </ul>
      </article>
      <article class="signal-card" role="listitem">
        <header>
          <span class="badge badge--mono">koreanscript</span>
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          <h3>언어 실험</h3>
        </header>
        <p>한글 키워드 기반 TypeScript 트랜스파일러를 제작해 --check 타입 검증과 인터랙티브 플레이그라운드까지 제공했습니다.</p>
        <ul class="signal-meta">
          <li>AST Transform</li>
          <li>Playground Deploy</li>
          <li>Type-level Spec</li>
        </ul>
      </article>
      <article class="signal-card" role="listitem">
        <header>
          <span class="badge badge--mono">visual-novel</span>
          <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
          <h3>스토리텔링 툴링</h3>
        </header>
        <p>JSON 시나리오와 자산 매핑, 저장/불러오기를 갖춘 웹 비주얼 노블 엔진을 배포해 팀이 바로 서사를 실험하도록 만들었습니다.</p>
        <ul class="signal-meta">
          <li>Scene Graph Runtime</li>
          <li>State Sync Layer</li>
          <li>Cloud Save Hook</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="tooling" class="section">
    <h2 class="section__title">Toolchain Playbook</h2>
    <p class="section__intro">현업에서 반복 사용하는 엔지니어링 툴과 워크플로를 컴포넌트 레벨로 문서화했습니다.</p>
    <div class="stack-grid" role="list">
      <article class="stack-card" role="listitem">
        <h3>Frontend Runtime</h3>
        <p>React 18 · Vue 3를 Scene Graph와 State Machine으로 엮어 인터랙션을 컴포저블하게 유지합니다.</p>
        <ul class="stack-card__tags">
          <li>React 18</li>
          <li>Vue 3</li>
          <li>XState</li>
          <li>Framer Motion</li>
        </ul>
      </article>
      <article class="stack-card" role="listitem">
        <h3>API &amp; Data Layer</h3>
        <p>TanStack Query와 OpenAPI 스키마를 CLI로 잇고, Contract-first 개발을 Changesets 릴리스로 묶습니다.</p>
        <ul class="stack-card__tags">
          <li>TanStack Query</li>
          <li>OpenAPI</li>
          <li>Zod</li>
          <li>MSW</li>
        </ul>
      </article>
      <article class="stack-card" role="listitem">
        <h3>Automation &amp; DevOps</h3>
        <p>pnpm Workspace, Bun 런타임, GitHub Actions로 빌드-테스트-배포 파이프라인을 자동화합니다.</p>
        <ul class="stack-card__tags">
          <li>Bun</li>
          <li>pnpm</li>
          <li>GitHub Actions</li>
          <li>Typedoc</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="capabilities" class="section">
    <h2 class="section__title">Capabilities</h2>
    <p class="section__intro">입력 난제를 통제하는 UI 레이어와, 팀 속도를 높이는 자동화 도구를 한 호흡으로 설계합니다.</p>
    <div class="focus-grid">
      <article class="focus-card">
        <h3>Interaction Architecture</h3>
        <p>React/Vue에서 상태 전이를 스토리보드처럼 모델링하고, 스크롤 · 모션 · 텍스트 연출을 타입으로 제어합니다.</p>
        <ul>
          <li>Declarative Scene Graph</li>
          <li>Scroll-driven Animation</li>
          <li>XState · TanStack Query</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>IME & Input Systems</h3>
        <p>한국어 조합, 가상 키보드, MIDI/Pointer 이벤트를 하나의 입력 파이프라인으로 묶습니다.</p>
        <ul>
          <li>Composition Event Handling</li>
          <li>Virtual Keyboard Guard</li>
          <li>Multi-device Latency Tuning</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>DX Automation</h3>
        <p>CLI, 코드 생성기, 템플릿을 통해 팀의 API 계약과 캐싱 전략을 자동화합니다.</p>
        <ul>
          <li>OpenAPI → React Query Hooks</li>
          <li>Scaffold Watch Mode</li>
          <li>Changesets · Husky Flow</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>Documentation Habit</h3>
        <p>데모/가이드/스토리텔링을 한 번에 패키징해, 도구가 팀 안에서 바로 사용될 수 있게 합니다.</p>
        <ul>
          <li>Typedoc · Storybook</li>
          <li>Interactive Playground</li>
          <li>Release Notes Automation</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="worklog" class="section">
    <h2 class="section__title">Project Signals</h2>
    <p class="section__intro">각 프로젝트는 문제 정의 → 실험 → 배포 → 문서화의 순환으로 완성됩니다. 펼쳐서 배경과 시스템 설계 노트를 확인해 보세요.</p>
    <div class="timeline" data-timeline>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.11</span>
          <span class="timeline-item__labels">
            <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
            Personal Site
          </span>
        </div>
        <h3 class="timeline-item__title">uiwwsw.github.io — 인터랙션 &amp; 자동화 포트폴리오 허브</h3>
        <p class="timeline-item__summary">Hero 카피부터 프로젝트 타임라인까지 AI 협업 스토리를 반영해, 상담 자동화와 DX 실험을 한눈에 정리한 최신 웹 레포입니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>Next-gen Hero와 Key Signal 섹션에 AI 배지를 배치해, 상담 플랫폼과 자동화 툴의 AI 사용 맥락을 빠르게 파악하도록 설계했습니다. GitHub Pages와 Actions로 지속 배포하며, 신규 레포와 문서가 생길 때마다 메타를 자동 업데이트합니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.10</span>
          <span class="timeline-item__labels">
            <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
            AI Platform
          </span>
        </div>
        <h3 class="timeline-item__title">Cushion.AI — AI-중재형 심리상담 지원 모노레포</h3>
        <p class="timeline-item__summary">Ionic 프론트엔드와 NestJS 백엔드, PostgreSQL, ChatGPT API를 묶어 상담 전 과정을 안전하게 안내하는 구독형 플랫폼을 구축하고 있습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>pnpm 워크스페이스 기반 모노레포로 Web · iOS · Android를 단일 코드베이스에서 제공하고, Prisma ORM과 PostgreSQL을 결합해 상담 세션 데이터를 영속화합니다. ChatGPT 통합으로 상담 전/중/후 안전장치를 강화하고, SNS 로그인과 구독 + 일일 무료 크레딧 정책을 실험 중입니다.</p>
          <p>SEO와 한국어 지역화를 고려한 SSR 전략은 <code>docs/architecture.md</code>에 정리하고, 향후 요구사항 변경은 <code>docs/</code> 디렉터리 문서로 기록해 협업 속도를 유지합니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.10</span>
          <span class="timeline-item__labels">
            <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
            Interaction Utility
          </span>
        </div>
        <h3 class="timeline-item__title">easter-egg — Konami Code 기반 이스터에그 시퀀스 엔진</h3>
        <p class="timeline-item__summary">Konami Code와 커스텀 키 시퀀스를 감지해 원하는 콜백을 실행하는 경량 TypeScript 라이브러리로, 2025년 7월 시작한 실험을
2025년 10월까지 확장했습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>window keyup 이벤트 리스너의 등록/해제를 안전하게 헬퍼로 추상화하고, 반복 입력 제한과 중첩 등록 방지를 옵션으로 제공해
어떤 프레임워크에서도 이스터에그를 빠르게 연결할 수 있게 했습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.09</span>
          <span class="timeline-item__labels">
            <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
            DX Automation
          </span>
        </div>
        <h3 class="timeline-item__title">react-query-help — React Query 코드 자동 생성기</h3>
        <p class="timeline-item__summary">API 스키마에서 React Query 훅·옵션·테스트 토대를 자동 생성하는 CLI를 2025년 9월에 마무리하며, 팀 캐싱 전략을 코드 생성으로
표준화했습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>watch 모드에서 OpenAPI 변화를 감지해 템플릿을 재생성하고, Bun·npm 중 원하는 런타임을 선택할 수 있도록 설계했습니다.
Changesets와 Husky를 포함한 릴리스 자동화 파이프라인도 함께 구축했습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.08</span>
          <span>Virtual Keyboard</span>
        </div>
        <h3 class="timeline-item__title">virtual-keyboard — 한국어 IME 제어 가상 키보드</h3>
        <p class="timeline-item__summary">브라우저 컴포지션 이슈를 우회하기 위해 2025년 8월에 제작한 React 가상 키보드. 모바일 네이티브 키보드를 차단하고 한국어 조합을
직접 제어합니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>컴포지션 상태를 스테이트 머신으로 관리해 중첩 입력을 안정적으로 처리하고, Storybook 데모와 Typedoc 문서를 CI로 배포해 팀
온보딩 시간을 줄였습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.07</span>
          <span>Automation Bot</span>
        </div>
        <h3 class="timeline-item__title">crypto-auto-trader — 이더리움 추세 추종 자동 투자 봇</h3>
        <p class="timeline-item__summary">이더리움 추세 추종 알고리즘과 커스텀 전략을 합성해 자동 투자하고 텔레그램으로 알림을 전달하는 Node.js 봇을 2025년 7월에 구축했습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>트렌드 지표와 커스텀 전략을 병렬로 평가해 합의된 시그널에서만 주문을 발행하고, 포지션·리스크 관리를 텔레그램 메시지와 대시보드로
실시간 노출했습니다. 스케줄러는 Node Cron으로 구성해 24시간 자동 매매를 유지했습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.09</span>
          <span>Payment Experiment</span>
        </div>
        <h3 class="timeline-item__title">pre-pay — 선불권을 디지털 워크플로로 전환한 프리페이 실험</h3>
        <p class="timeline-item__summary">선불권 구매·사용 경험을 웹으로 옮겨, 사용자가 잔액을 직접 확인하고 운영자가 사용 이력을 추적할 수 있도록 설계한 실험 프로젝트.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>Velog 포스트 <a href="https://velog.io/@uiwwsw/%EC%84%A0%EB%B6%88%EA%B6%8C%EC%9D%84-%EB%94%94%EC%A7%80%ED%84%B8%EB%A1%9C-%ED%94%84%EB%A6%AC%ED%8E%98%EC%9D%B4-%EC%8B%A4%ED%97%98%EA%B8%B0" target="_blank" rel="noopener">선불권을 디지털로 프리페이 실험기</a>에서 공유한 흐름을 따라, 온라인 결제 이후 자동으로 선불권을 발급하고 사용 시 잔여 금액을 갱신하는 파이프라인을 구축했습니다. 오프라인 매장의 수기 정산을 대신해, 발급·사용 내역이 하나의 대시보드에 정리되도록 했습니다.</p>
          <p><code>pre-pay</code> 저장소는 실 서비스 결제 데이터가 포함돼 GitHub Private Repository로 운영하고 있습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.08</span>
          <span class="timeline-item__labels">
            <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
            Interaction Utility
          </span>
        </div>
        <h3 class="timeline-item__title">easter-egg — Konami Code를 감지하는 인터랙션 유틸</h3>
        <p class="timeline-item__summary">Konami Code 입력을 감지해 원하는 콜백을 실행하고, 커스텀 시퀀스도 등록할 수 있는 경량 TypeScript 라이브러리.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>window 이벤트에 안전하게 keyup 리스너를 붙이고 떼는 헬퍼를 제공해 리액트/바닐라 어디서든 쉽게 쓸 수 있습니다. Konami Code 외에도 원하는 키 시퀀스를 타입으로 정의하고, 반복 입력 제한이나 중첩 등록을 옵션으로 제어해 Easter Egg 연출을 빠르게 연결했습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.07</span>
          <span>Virtual Keyboard</span>
        </div>
        <h3 class="timeline-item__title">virtual-keyboard — 한국어 IME를 제어하는 입력 엔진</h3>
        <p class="timeline-item__summary">composition 이벤트에 의존하지 않고 한국어 조합을 제어하는 React 가상 키보드. 모바일 네이티브 키보드 차단까지 지원합니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>컴포지션 상태를 스테이트 머신으로 직접 관리해 중첩 입력을 안전하게 처리하고, 모바일에선 포커스 가드로 네이티브 키보드를 차단했습니다. Storybook 데모와 Typedoc 문서를 CI로 자동 배포해 팀 온보딩 시간을 줄였습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.05</span>
          <span class="timeline-item__labels">
            <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
            DX Automation
          </span>
        </div>
        <h3 class="timeline-item__title">react-query-helper — OpenAPI에서 훅까지</h3>
        <p class="timeline-item__summary">API 함수에서 React Query 훅과 옵션, 테스트 토대를 자동 생성하는 CLI로 팀 캐싱 전략을 일관화했습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>watch 모드에서 OpenAPI 스키마 변화를 감지해 훅/타입/테스트를 재생성하고, Bun과 npm 중 원하는 런타임을 선택할 수 있도록 템플릿을 분리했습니다. Changesets와 Husky를 기본 탑재해 릴리스 과정도 자동화했습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.03</span>
          <span class="timeline-item__labels">
            <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
            Transpiler
          </span>
        </div>
        <h3 class="timeline-item__title">koreanscript — 한글 키워드 기반 TS 트랜스파일러</h3>
        <p class="timeline-item__summary">한글 키워드로 작성한 .ks 파일을 TypeScript로 변환하고, --check 모드로 타입 검증을 제공하는 실험적 도구입니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>KS → TS 변환에 토큰 맵핑 표를 제공하고, 타입 체크 모드에서는 tsserver를 child process로 구동해 즉시 오류를 피드백합니다. CLI UX는 Commander 기반으로 설계해 플러그인 확장이 쉽습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2025.08</span>
          <span class="timeline-item__labels">
            <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
            Story Engine
          </span>
        </div>
        <h3 class="timeline-item__title">visual-novel — JSON 기반 비주얼 노블 툴킷</h3>
        <p class="timeline-item__summary">React+Vite 기반으로 장면, 자산, 세이브 시스템을 갖춘 웹 비주얼 노블 엔진을 구축했습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>JSON 시나리오를 XState 머신으로 해석해 선택지 분기를 관리하고, 자산 매핑/저장 데이터를 IndexedDB에 기록했습니다. 튜토리얼과 스타터 템플릿을 함께 배포해 누구나 바로 실험할 수 있게 했습니다.</p>
        </div>
      </article>
    </div>
  </section>

  <section id="projects" class="section">
    <h2 class="section__title">Project Showcase</h2>
    <p class="section__intro">어떤 실험이든 코드는 이야기와 연결되어야 한다는 믿음으로, 제품부터 라이브러리까지 다양한 형태를 다룹니다.</p>
    <div class="project-filter" role="group" aria-label="프로젝트 유형 필터" data-project-filter>
      <button class="chip is-active" type="button" data-filter="all">모두</button>
      <button class="chip" type="button" data-filter="story">스토리텔링</button>
      <button class="chip" type="button" data-filter="automation">자동화</button>
      <button class="chip" type="button" data-filter="tooling">툴링</button>
      <button class="chip" type="button" data-filter="experience">경험 설계</button>
    </div>
    <div class="project-grid" data-project-list>
      <article class="project-card" data-category="experience automation tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          2025 · Personal Site
        </span>
        <h3 class="project-card__title">uiwwsw.github.io</h3>
        <p class="project-card__description">TypeScript 인터랙션과 AI 협업 스토리를 통합한 최신 포트폴리오. Hero 복사부터 타임라인까지 자동화 레포와 상담 플랫폼을 연결합니다.</p>
        <ul class="project-card__tags">
          <li>Jekyll</li>
          <li>TypeScript DX</li>
          <li>GitHub Actions</li>
        </ul>
      </article>
      <article class="project-card" data-category="automation experience tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          2024 · AI Platform
        </span>
        <h3 class="project-card__title">Cushion.AI</h3>
        <p class="project-card__description">Ionic + NestJS + PostgreSQL 기반 AI 중재 상담 플랫폼. ChatGPT 안전장치와 구독·크레딧 정책을 모노레포에서 실험합니다.</p>
        <ul class="project-card__tags">
          <li>Ionic</li>
          <li>NestJS</li>
          <li>ChatGPT API</li>
        </ul>
      </article>
      <article class="project-card" data-category="automation tooling">
        <span class="project-card__meta">2005 · Automation Bot</span>
        <h3 class="project-card__title">crypto-auto-trader</h3>
        <p class="project-card__description">이더리움 추세 추종과 커스텀 전략을 합성해 자동 투자하고, 텔레그램으로 포지션 알림을 전송하는 Node.js 기반 거래 봇.</p>
        <ul class="project-card__tags">
          <li>Node.js</li>
          <li>Telegram Bot</li>
          <li>Crypto Trading</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience tooling">
        <span class="project-card__meta">2005 · Virtual Keyboard</span>
        <h3 class="project-card__title">virtual-keyboard</h3>
        <p class="project-card__description">한국어 IME 컴포지션을 자체 처리하고 모바일 네이티브 키보드를 차단하는 React 가상 키보드 라이브러리.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>TypeScript</li>
          <li>Storybook</li>
        </ul>
      </article>
      <article class="project-card" data-category="automation tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          2005 · DX Automation
        </span>
        <h3 class="project-card__title">react-query-help</h3>
        <p class="project-card__description">OpenAPI 스키마에서 React Query 훅과 옵션, 테스트 토대를 자동 생성하는 CLI. watch 모드와 템플릿 확장으로 팀 일관성을 확보합니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>OpenAPI</li>
          <li>CLI</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
          2005 · Interaction Utility
        </span>
        <h3 class="project-card__title">easter-egg</h3>
        <p class="project-card__description">Konami Code 시퀀스를 감지해 easter egg 콜백을 실행하는 경량 TypeScript 라이브러리. 리스너 등록/해제를 헬퍼로 추상화했습니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>Konami Code</li>
          <li>Micro Interaction</li>
        </ul>
      </article>
      <article class="project-card" data-category="story experience">
        <span class="project-card__meta">2024 · Story Engine</span>
        <h3 class="project-card__title">Polaroid Syntax</h3>
        <p class="project-card__description">JSON 시나리오만으로 장면을 호출하는 비주얼 노블 엔진. React와 Canvas, XState로 연출과 상태 분기를 선언적으로 다룹니다.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>Vite</li>
          <li>XState</li>
        </ul>
      </article>
      <article class="project-card" data-category="automation tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          2024 · DX Automation
        </span>
        <h3 class="project-card__title">react-query-helper</h3>
        <p class="project-card__description">OpenAPI 스키마에서 React Query 훅과 옵션, 테스트 토대를 자동 생성하는 CLI. watch 모드와 템플릿 확장으로 팀 일관성을 확보합니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>OpenAPI</li>
          <li>CLI</li>
        </ul>
      </article>
      <article class="project-card" data-category="tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          2024 · Language Experiment
        </span>
        <h3 class="project-card__title">koreanscript</h3>
        <p class="project-card__description">한글 키워드 기반 .ks 코드를 TypeScript로 트랜스파일하고, --check 모드로 타입 오류를 바로 피드백하는 실험적 도구입니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>Transpiler</li>
          <li>CLI</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience tooling">
        <span class="project-card__meta">2023 · Interaction Library</span>
        <h3 class="project-card__title">virtual-keyboard</h3>
        <p class="project-card__description">한국어 IME 컴포지션을 자체 처리하고 모바일 네이티브 키보드를 차단하는 React 가상 키보드 라이브러리.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>TypeScript</li>
          <li>Storybook</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience">
        <span class="project-card__meta">2022 · Game Prototype</span>
        <h3 class="project-card__title">uitetris</h3>
        <p class="project-card__description">Canvas 위에서 테트로미노 회전과 낙하를 직접 구현한 웹 테트리스. 반응형 입력과 라인 클리어 애니메이션을 커스텀 처리했습니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>Canvas</li>
          <li>Game Loop</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="writing" class="section">
    <h2 class="section__title">Writing & Notes</h2>
    <p class="section__intro">velog에는 구현 실험 로그를, 블로그에는 라이브러리 설계 노트를 기록합니다. 문서화가 곧 다음 인터랙션 실험의 시나리오입니다.</p>
    <div class="post-list">
      {% for post in site.posts limit:3 %}
        <article class="post-card">
          <span class="post-card__meta">{{ post.date | date: '%Y.%m.%d' }} · {{ post.tags | join: ', ' }}</span>
          <h3 class="post-card__title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
          <p class="post-card__excerpt">{{ post.excerpt | strip_html | truncate: 160 }}</p>
        </article>
      {% endfor %}
      {% if site.posts == empty %}
        <p>곧 프로젝트 로그를 업데이트할 예정입니다.</p>
      {% endif %}
    </div>
    <div class="writing-callout">
      <h3>다음 글은 이런 주제를 다룹니다</h3>
      <ul>
        <li>한국어 IME를 제어하는 virtual-keyboard 설계기</li>
        <li>OpenAPI 변화에 반응하는 React Query 코드 생성 파이프라인</li>
      </ul>
    </div>
  </section>
</div>

<script>
  const projectFilter = document.querySelector('[data-project-filter]');
  const projectList = document.querySelector('[data-project-list]');
  if (projectFilter && projectList) {
    const cards = Array.from(projectList.querySelectorAll('.project-card'));
    projectFilter.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const filter = target.dataset.filter;
      projectFilter.querySelectorAll('button').forEach((button) => button.classList.remove('is-active'));
      target.classList.add('is-active');
      cards.forEach((card) => {
        const category = card.dataset.category || '';
        const isVisible = !filter || filter === 'all' || category.split(' ').includes(filter);
        card.toggleAttribute('hidden', !isVisible);
      });
    });
  }

  const timeline = document.querySelector('[data-timeline]');
  if (timeline) {
    timeline.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest('.timeline-item__toggle');
      if (!(button instanceof HTMLButtonElement)) return;
      const detail = button.nextElementSibling;
      if (!(detail instanceof HTMLElement)) return;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      detail.hidden = expanded;
    });
  }
</script>
