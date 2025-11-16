---
layout: default
title: Matthew Yoon — 윤창원
---

<div class="container">
  <section id="profile" class="hero">
    <div class="hero__lead">
      <p class="hero__eyebrow">윤창원 · Matthew Yoon</p>
      <h1 class="hero__title">인터랙션과 디자인 시스템을 연결해 제품 팀의 속도를 높이는 프런트엔드 개발자입니다.</h1>
      <p class="hero__subtitle">React · Vue 모노레포에서 상태 전이를 모델링하고, CLI와 코드 생성기로 반복 작업을 자동화합니다. 입력 제어, 디자인 토큰, 문서를 한 파이프라인으로 묶어 팀이 <strong>집중</strong>과 <strong>지속성</strong>을 얻도록 설계합니다.</p>
      <ul class="hero__meta" aria-label="현재 작업 요약">
        <li><span class="badge badge--live">Live Build</span> React Query 스캐폴더와 Storybook/Typedoc 워크플로를 Changesets로 꾸준히 배포 중입니다.</li>
        <li><span class="badge badge--mono">Focus</span> 한국어 IME 제어 가상 키보드, Scene Graph 기반 인터랙션 엔진, 상담 플랫폼 디자인 시스템.</li>
      </ul>
      <div class="hero__actions" role="group" aria-label="바로 가기">
        <a class="button" href="#projects">최근 빌드 살펴보기</a>
        <a class="button button--ghost" href="https://velog.io/@uiwwsw" target="_blank" rel="noopener">Velog에서 읽기</a>
      </div>
    </div>
    <div class="hero__code" aria-label="Profile code sample">
      <div class="hero__editor-head">
        <div class="hero__editor-tabs" role="tablist" aria-label="Code tabs">
          <span role="tab" aria-selected="true">app/hero.tsx</span>
          <span role="tab" aria-selected="false">workflow.ts</span>
        </div>
        <span class="hero__editor-status">build ✅</span>
      </div>
      <pre class="language-tsx"><code class="language-tsx">import { composeInputPipeline, storyboard, deployPlaybook } from '@uiwwsw/frontend-lab';

type TenYearFrontend = ReturnType&lt;typeof storyboard&gt;;

const matthew: TenYearFrontend = storyboard({
  tenure: '10Y',
  stack: ['React', 'Vue', 'IME systems'],
  rituals: ['scene graph sketch', 'CLI automation'],
  guardrails: composeInputPipeline(['keyboard', 'pointer', 'midi']),
});

export const Hero = () => (
  &lt;HeroCanvas focus="interaction+automation" onShip={deployPlaybook(matthew)} /&gt;
);
</code></pre>
      <div class="hero__editor-footer">
        <span>10Y Frontend · Interaction Systems Artisan</span>
        <span aria-hidden="true">⌘ + ⇧ + P</span>
      </div>
    </div>
    <div class="hero__grid" role="list">
      <article class="hero__card" role="listitem">
        <div class="hero__card-head">
          <span class="badge">Core Loop</span>
          <h3>Interaction &amp; Automation</h3>
        </div>
        <p>상태 전이를 스토리보드처럼 정리하고, CLI로 반복 작업을 줄여 실험 속도를 유지합니다.</p>
        <p class="hero__note">문서, 스토리, 빌드 스크립트를 같은 저장소에서 다룹니다.</p>
      </article>
      <article class="hero__card" role="listitem">
        <div class="hero__card-head">
          <span class="badge">Systems</span>
          <h3>IME · 입력 시스템</h3>
        </div>
        <p>한국어 조합, 포인터, MIDI 이벤트까지 다루는 입력 파이프라인을 직접 구성해 까다로운 UX도 타입으로 검증합니다.</p>
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
    <p class="section__intro">최근 프로젝트 가운데 인터랙션 문제와 DX 자동화를 동시에 다룬 작업을 짧게 기록했습니다.</p>
    <div class="signal-grid" role="list">
      <article class="signal-card" role="listitem">
        <a class="signal-card__surface" href="https://github.com/uiwwsw/virtual-keyboard" target="_blank" rel="noopener">
          <header>
            <span class="badge badge--mono">virtual-keyboard</span>
            <h3>한국어 IME 난제 해결</h3>
          </header>
          <p>Composition 이벤트와 커스텀 키보드를 상태 머신 하나로 묶어 모바일 네이티브 키보드가 끼어들 틈을 줄였습니다.</p>
          <ul class="signal-meta">
            <li>React 가상 키보드</li>
            <li>IME Latency Guard</li>
            <li>Storybook + Typedoc 배포</li>
          </ul>
        </a>
        <div class="signal-card__links" aria-label="관련 레포지토리">
          <a class="signal-card__link" href="https://github.com/uiwwsw/virtual-keyboard" target="_blank" rel="noopener">virtual-keyboard</a>
          <a class="signal-card__link" href="https://github.com/uiwwsw/virtual-keyboard-storybook" target="_blank" rel="noopener">storybook 패키지</a>
        </div>
      </article>
      <article class="signal-card" role="listitem">
        <a class="signal-card__surface" href="https://github.com/uiwwsw/react-query-helper" target="_blank" rel="noopener">
          <header>
            <span class="badge badge--mono">react-query-helper</span>
            <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
            <h3>DX 자동화</h3>
          </header>
          <p>OpenAPI 스키마만으로 React Query 훅·옵션·테스트를 만들어 팀 캐싱 전략을 코드 생성으로 정리했습니다.</p>
          <ul class="signal-meta">
            <li>Watch Mode Scaffold</li>
            <li>Bun · pnpm 지원</li>
            <li>Changesets 릴리스</li>
          </ul>
        </a>
        <div class="signal-card__links" aria-label="관련 레포지토리">
          <a class="signal-card__link" href="https://github.com/uiwwsw/react-query-helper" target="_blank" rel="noopener">CLI 레포</a>
          <a class="signal-card__link" href="https://github.com/uiwwsw/react-query-helper-templates" target="_blank" rel="noopener">템플릿</a>
          <a class="signal-card__link" href="https://github.com/uiwwsw/react-query-helper-docs" target="_blank" rel="noopener">Storybook · Docs</a>
        </div>
      </article>
      <article class="signal-card" role="listitem">
        <a class="signal-card__surface" href="https://github.com/uiwwsw/koreanscript" target="_blank" rel="noopener">
          <header>
            <span class="badge badge--mono">koreanscript</span>
            <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
            <h3>언어 실험</h3>
          </header>
          <p>한글 키워드 기반 TypeScript 트랜스파일러를 만들어 --check 타입 검증과 인터랙티브 플레이그라운드를 붙였습니다.</p>
          <ul class="signal-meta">
            <li>AST Transform</li>
            <li>Playground Deploy</li>
            <li>Type-level Spec</li>
          </ul>
        </a>
        <div class="signal-card__links" aria-label="관련 레포지토리">
          <a class="signal-card__link" href="https://github.com/uiwwsw/koreanscript" target="_blank" rel="noopener">koreanscript</a>
          <a class="signal-card__link" href="https://github.com/uiwwsw/koreanscript-playground" target="_blank" rel="noopener">Playground</a>
        </div>
      </article>
      <article class="signal-card" role="listitem">
        <a class="signal-card__surface" href="https://github.com/uiwwsw/visual-novel" target="_blank" rel="noopener">
          <header>
            <span class="badge badge--mono">visual-novel</span>
            <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
            <h3>스토리텔링 툴링</h3>
          </header>
          <p>JSON 시나리오, 자산 매핑, 저장/불러오기를 갖춘 웹 비주얼 노블 엔진을 배포해 바로 서사를 실험할 수 있게 했습니다.</p>
          <ul class="signal-meta">
            <li>Scene Graph Runtime</li>
            <li>State Sync Layer</li>
            <li>Cloud Save Hook</li>
          </ul>
        </a>
        <div class="signal-card__links" aria-label="관련 레포지토리">
          <a class="signal-card__link" href="https://github.com/uiwwsw/visual-novel" target="_blank" rel="noopener">엔진 레포</a>
          <a class="signal-card__link" href="https://github.com/uiwwsw/visual-novel-assets" target="_blank" rel="noopener">Asset Pack</a>
        </div>
      </article>
      <article class="signal-card" role="listitem">
        <a class="signal-card__surface" href="https://github.com/uiwwsw/cushion-ai" target="_blank" rel="noopener">
          <header>
            <span class="badge badge--mono">cushion.ai</span>
            <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
            <h3>AI 상담 파이프라인</h3>
          </header>
          <p>Ionic + NestJS 모노레포에서 상담 예약, 구독 결제, AI 세션 요약을 연결해 운영팀과 사용자 경험을 동시에 개선했습니다.</p>
          <ul class="signal-meta">
            <li>구독/크레딧 정책</li>
            <li>pnpm Workspace</li>
            <li>유효성 스키마 공유</li>
          </ul>
        </a>
        <div class="signal-card__links" aria-label="관련 레포지토리">
          <a class="signal-card__link" href="https://github.com/uiwwsw/cushion-ai" target="_blank" rel="noopener">App 레포</a>
          <a class="signal-card__link" href="https://github.com/uiwwsw/cushion-ai-designkit" target="_blank" rel="noopener">Design Kit</a>
        </div>
      </article>
      <article class="signal-card" role="listitem">
        <a class="signal-card__surface" href="https://github.com/uiwwsw/dx-playbook" target="_blank" rel="noopener">
          <header>
            <span class="badge badge--mono">dx-playbook</span>
            <h3>Docs · Storybook 자동화</h3>
          </header>
          <p>Storybook, Typedoc, Lighthouse 리포트를 같은 GitHub Actions 파이프라인에서 배포해 인터랙션 실험과 문서화를 동시에 추적합니다.</p>
          <ul class="signal-meta">
            <li>Turbo + Changesets</li>
            <li>QA Report Upload</li>
            <li>Reusable Recipes</li>
          </ul>
        </a>
        <div class="signal-card__links" aria-label="관련 레포지토리">
          <a class="signal-card__link" href="https://github.com/uiwwsw/dx-playbook" target="_blank" rel="noopener">Playbook</a>
          <a class="signal-card__link" href="https://github.com/uiwwsw/dx-playbook-actions" target="_blank" rel="noopener">Actions</a>
          <a class="signal-card__link" href="https://github.com/uiwwsw/dx-playbook-recipes" target="_blank" rel="noopener">Recipes</a>
        </div>
      </article>
    </div>
  </section>

  <section id="tooling" class="section">
    <h2 class="section__title">Toolchain Playbook</h2>
    <p class="section__intro">자주 쓰는 툴과 워크플로를 기록해 두고, 프로젝트마다 필요한 조합을 빠르게 꺼내 씁니다.</p>
    <div class="stack-grid" role="list">
      <article class="stack-card" role="listitem">
        <h3>Frontend Runtime</h3>
        <p>React 18 · Vue 3에 Scene Graph와 상태 머신을 붙여 인터랙션을 조립식으로 관리합니다.</p>
        <ul class="stack-card__tags">
          <li>React 18</li>
          <li>Vue 3</li>
          <li>XState</li>
          <li>Framer Motion</li>
        </ul>
      </article>
      <article class="stack-card" role="listitem">
        <h3>API &amp; Data Layer</h3>
        <p>TanStack Query와 OpenAPI 스키마를 CLI로 연결해 Contract-first 개발을 Changesets 릴리스로 묶습니다.</p>
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
    <p class="section__intro">입력 제어가 필요한 UI와 팀 속도를 다지는 자동화 도구를 같은 흐름에서 설계합니다.</p>
    <div class="focus-grid">
      <article class="focus-card">
        <h3>Interaction Architecture</h3>
        <p>React/Vue에서 상태 전이를 스토리보드처럼 적어 두고, 스크롤 · 모션 · 텍스트 연출을 타입으로 제어합니다.</p>
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
        <p>CLI, 코드 생성기, 템플릿으로 팀의 API 계약과 캐싱 전략을 자동화합니다.</p>
        <ul>
          <li>OpenAPI → React Query Hooks</li>
          <li>Scaffold Watch Mode</li>
          <li>Changesets · Husky Flow</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>Documentation Habit</h3>
        <p>데모, 가이드, 스토리를 한 번에 패키징해 도구가 팀 안에서 바로 쓰이도록 만듭니다.</p>
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
  <p class="section__intro">실제 제품과 운영 도구에서 맡은 프런트엔드 역할을 시기별로 정리했습니다. 각 항목을 펼쳐 문제 정의와 설계 기록을 확인할 수 있습니다.</p>
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
      <p class="timeline-item__summary">Hero, Signal, Timeline 컴포넌트를 재구성해 프런트엔드 설계 역량과 실험 노트를 한 화면에서 탐색할 수 있게 했습니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>GitHub Actions로 스타일 가이드, 포스트 메타 데이터를 자동 반영하는 스크립트를 붙여 새 프로젝트를 추가할 때마다 Hero, 프로젝트 카드가 동시에 갱신되도록 했습니다.</p>
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
      <h3 class="timeline-item__title">Cushion.AI — 상담 구독형 모노레포</h3>
      <p class="timeline-item__summary">Ionic + React 프런트엔드와 NestJS API를 pnpm 모노레포로 묶어 상담 예약, 구독 결제, AI 세션 요약을 한 파이프라인으로 제공합니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>Design System과 입력 가드를 공유할 수 있도록 Storybook/Docs 배포를 통합했고, Prisma + PostgreSQL 스키마를 React Query 코드 생성기와 연결해 계약 변경에 즉시 대응했습니다.</p>
      </div>
    </article>
    <article class="timeline-item">
      <div class="timeline-item__meta">
        <span>2025.10</span>
        <span class="timeline-item__labels">
          <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
          Design System
        </span>
      </div>
      <h3 class="timeline-item__title">Cushion Design Kit — 상담팀 UI 토큰</h3>
      <p class="timeline-item__summary">타이포, 컬러, 컴포넌트를 디자인 토큰으로 추상화해 Web · iOS · Android가 동일한 Scene Graph와 Motion 프리셋을 사용할 수 있게 했습니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>다크/라이트 테마와 모달 상호작용을 Storybook Docs + Figma Tokens로 동기화하고, QA 노트를 GitHub Issue Form으로 자동화해 팀 피드백 루프를 줄였습니다.</p>
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
      <p class="timeline-item__summary">OpenAPI → 훅/테스트/문서까지 이어지는 CLI를 만들어 대규모 상담 API를 안전하게 소비하고, 캐싱 정책을 레포에서 통합 관리했습니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>watch 모드에서 스키마 변화를 감지해 TanStack Query 훅을 재생성하고, Bun/pnpm 기반 샌드박스로 바로 검증할 수 있게 했습니다.</p>
      </div>
    </article>
    <article class="timeline-item">
      <div class="timeline-item__meta">
        <span>2025.08</span>
        <span class="timeline-item__labels">
          <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
          Input System
        </span>
      </div>
      <h3 class="timeline-item__title">virtual-keyboard — 한국어 IME 제어 가상 키보드</h3>
      <p class="timeline-item__summary">한국어 조합 상태를 직접 다루는 React 입력 엔진으로 상담 기록 중 모바일 네이티브 키보드가 끼어드는 문제를 해결했습니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>Composition 이벤트를 상태 머신으로 재구성하고, Storybook + Typedoc을 CI에서 동시에 배포해 QA와 온보딩 시간을 줄였습니다.</p>
      </div>
    </article>
    <article class="timeline-item">
      <div class="timeline-item__meta">
        <span>2025.08</span>
        <span class="timeline-item__labels">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          Admin App
        </span>
      </div>
      <h3 class="timeline-item__title">Studio Admin — 예약/정산 대시보드</h3>
      <p class="timeline-item__summary">React + Next.js로 스튜디오 예약, 정산, 알림을 관리하는 운영 도구를 구축해 운영자의 수기 시트를 제거했습니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>Stripe 결제 이벤트를 Webhook으로 수신해 대시보드에 반영하고, Prisma + Supabase를 통해 잔여 크레딧과 이용 이력을 시각화했습니다.</p>
      </div>
    </article>
    <article class="timeline-item">
      <div class="timeline-item__meta">
        <span>2025.07</span>
        <span class="timeline-item__labels">
          <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
          Ops Console
        </span>
      </div>
      <h3 class="timeline-item__title">CareOps Dashboard — 상담 운영 React 대시보드</h3>
      <p class="timeline-item__summary">실시간 상담 지표와 사용자 피드백을 WebSocket + Zustand 상태로 묶어 상담 코디네이터가 상황을 한눈에 파악하도록 했습니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>멀티 패널 구성과 단축키를 제공해 상담 배정, 캔드 리스폰스, 고객 티켓 변동을 키보드 중심으로 처리할 수 있도록 개선했습니다.</p>
      </div>
    </article>
    <article class="timeline-item">
      <div class="timeline-item__meta">
        <span>2025.05</span>
        <span class="timeline-item__labels">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          Docs Automation
        </span>
      </div>
      <h3 class="timeline-item__title">DX Playbook — Storybook · Typedoc 자동화</h3>
      <p class="timeline-item__summary">Design System과 API 문서를 같은 릴리스 파이프라인에 묶어, 배포 시점마다 가이드/샘플 코드가 동시에 갱신되도록 했습니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>Turbo + Changesets 조합으로 패키지별 독립 버전을 유지하고, GitHub Actions에서 Lighthouse/Playwright 리포트를 첨부해 품질 지표를 자동으로 남겼습니다.</p>
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
      <p class="timeline-item__summary">한글 키워드와 TypeScript 타입 체커를 묶어 디자이너·기획자도 프로토타이핑에 참여할 수 있게 만든 언어 실험입니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>토큰 매핑 테이블과 Playground를 제공해 브라우저에서 즉시 실행할 수 있도록 했고, VS Code 확장 샘플을 배포해 편집기 통합을 시험했습니다.</p>
      </div>
    </article>
    <article class="timeline-item">
      <div class="timeline-item__meta">
        <span>2025.02</span>
        <span class="timeline-item__labels">
          <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
          Story Engine
        </span>
      </div>
      <h3 class="timeline-item__title">visual-novel — JSON 기반 비주얼 노블 툴킷</h3>
      <p class="timeline-item__summary">Scene Graph, 자산 매핑, 저장 시스템을 React+Vite로 제공해 스토리 작가가 직접 인터랙션을 조립할 수 있게 했습니다.</p>
      <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
      <div class="timeline-item__detail" hidden>
        <p>XState 상태 머신으로 분기/저장을 관리하고, IndexedDB를 백업 스토리지로 사용해 오프라인에서도 스토리 테스트가 가능하도록 했습니다.</p>
      </div>
    </article>
  </div>
</section>


  <section id="projects" class="section">
    <h2 class="section__title">Project Showcase</h2>
    <p class="section__intro">제품, 라이브러리, 실험 노트를 구분하지 않고 같은 맥락에서 정리했습니다.</p>
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
        <p class="project-card__description">TypeScript 인터랙션과 AI 협업 작업을 한 레포에서 정리한 포트폴리오입니다. Hero, 타임라인, 자동화 레포를 한 화면에 담았습니다.</p>
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
        <p class="project-card__description">Ionic + NestJS + PostgreSQL 기반 AI 중재 상담 플랫폼입니다. ChatGPT 안전장치와 구독·크레딧 정책을 모노레포에서 실험합니다.</p>
        <ul class="project-card__tags">
          <li>Ionic</li>
          <li>NestJS</li>
          <li>ChatGPT API</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience automation tooling">
        <span class="project-card__meta">2025 · Ops Console</span>
        <h3 class="project-card__title">CareOps Dashboard</h3>
        <p class="project-card__description">상담 운영자가 사용하는 React 대시보드로, 세션 큐, SLA 타이머, 실시간 피드백 스트림을 WebSocket으로 연결했습니다.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>Zustand</li>
          <li>WebSocket</li>
        </ul>
      </article>
      <article class="project-card" data-category="automation tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          2025 · DX Automation
        </span>
        <h3 class="project-card__title">react-query-help</h3>
        <p class="project-card__description">OpenAPI 스키마에서 React Query 훅과 옵션, 테스트 토대를 자동 생성하는 CLI입니다. watch 모드와 템플릿 확장으로 팀 일관성을 유지합니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>OpenAPI</li>
          <li>CLI</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai-half" aria-label="AI 보조">AI ½</span>
          2025 · Interaction Utility
        </span>
        <h3 class="project-card__title">easter-egg</h3>
        <p class="project-card__description">Konami Code 시퀀스를 감지해 easter egg 콜백을 실행하는 경량 TypeScript 라이브러리입니다. 리스너 등록/해제를 헬퍼로 추상화했습니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>Konami Code</li>
          <li>Micro Interaction</li>
        </ul>
      </article>
      <article class="project-card" data-category="story experience">
        <span class="project-card__meta">2024 · Story Engine</span>
        <h3 class="project-card__title">Polaroid Syntax</h3>
        <p class="project-card__description">JSON 시나리오만으로 장면을 호출하는 비주얼 노블 엔진입니다. React와 Canvas, XState로 연출과 상태 분기를 선언적으로 다룹니다.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>Vite</li>
          <li>XState</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience automation">
        <span class="project-card__meta">2024 · Admin App</span>
        <h3 class="project-card__title">Studio Admin</h3>
        <p class="project-card__description">Next.js 기반 운영 도구로 예약, 정산, 알림을 통합했고 Stripe Webhook과 Supabase를 연결해 잔여 크레딧을 실시간 반영합니다.</p>
        <ul class="project-card__tags">
          <li>Next.js</li>
          <li>Stripe</li>
          <li>Supabase</li>
        </ul>
      </article>
      <article class="project-card" data-category="tooling">
        <span class="project-card__meta">
          <span class="badge badge--ai" aria-label="AI 시스템">AI</span>
          2024 · Language Experiment
        </span>
        <h3 class="project-card__title">koreanscript</h3>
        <p class="project-card__description">한글 키워드 기반 .ks 코드를 TypeScript로 트랜스파일하고 --check 모드로 타입 오류를 바로 피드백하는 실험적 도구입니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>Transpiler</li>
          <li>CLI</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience tooling">
        <span class="project-card__meta">2023 · Interaction Library</span>
        <h3 class="project-card__title">virtual-keyboard</h3>
        <p class="project-card__description">한국어 IME 컴포지션을 자체 처리하고 모바일 네이티브 키보드를 차단하는 React 가상 키보드 라이브러리입니다.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>TypeScript</li>
          <li>Storybook</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience">
        <span class="project-card__meta">2022 · Game Prototype</span>
        <h3 class="project-card__title">uitetris</h3>
        <p class="project-card__description">Canvas 위에서 테트로미노 회전과 낙하를 직접 구현한 웹 테트리스입니다. 반응형 입력과 라인 클리어 애니메이션을 커스텀 처리했습니다.</p>
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
    <p class="section__intro">Velog에는 구현 실험 로그를, 이 블로그에는 라이브러리 설계 노트를 남깁니다. 문서화 과정을 다음 인터랙션 실험의 시나리오로 삼습니다.</p>
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
