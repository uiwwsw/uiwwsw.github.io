---
layout: default
title: Matthew Yoon — 윤창원
---

<section class="masthead" aria-labelledby="intro-heading">
  <div class="container masthead__grid">
    <div class="masthead__intro">
      <p class="eyebrow">윤창원 · Matthew Yoon</p>
      <h1 id="intro-heading">프런트엔드에서 인터랙션과 디자인 시스템을 한 덩어리로 빌드해내는 사람입니다.</h1>
      <p class="lede">
        React · Vue 모노레포에서 상태 전이를 모델링하고, CLI와 코드 생성기로 반복 작업을 자동화합니다.
        입력 제어, 디자인 토큰, 문서를 한 파이프라인으로 묶어 팀이 <strong>집중</strong>과 <strong>지속성</strong>을 얻도록 설계합니다.
      </p>
      <div class="masthead__badges" aria-label="현재 포커스">
        <span class="pill pill--live">Live Build</span>
        <span>React Query 스캐폴더 · Storybook/Typedoc 워크플로</span>
        <span class="pill pill--focus">Focus</span>
        <span>한국어 IME · Scene Graph 인터랙션 · 상담 플랫폼 디자인 시스템</span>
      </div>
      <div class="masthead__actions" role="group" aria-label="바로 가기">
        <a class="button" href="#projects">시그니처 빌드 보기</a>
        <a class="button button--ghost" href="https://velog.io/@uiwwsw" target="_blank" rel="noopener">Velog에서 읽기</a>
      </div>
    </div>
    <div class="masthead__panel" aria-label="Workflow snapshot">
      <header class="panel__header">
        <div>
          <p class="panel__eyebrow">10Y Frontend</p>
          <h2>Interaction + Automation</h2>
        </div>
        <span class="status status--good">build passing</span>
      </header>
      <div class="panel__body">
        <div class="panel__code">
<pre><code>import { storyboard, composeInputPipeline } from '@uiwwsw/frontend-lab';

const matthew = storyboard({
  tenure: '10Y',
  stack: ['React', 'Vue', 'IME systems'],
  rituals: ['scene graph sketch', 'CLI automation'],
  guardrails: composeInputPipeline(['keyboard', 'pointer', 'midi']),
});

export const Hero = () => (
  &lt;HeroCanvas focus="interaction+automation" onShip={deployPlaybook(matthew)} /&gt;
);
</code></pre>
        </div>
        <ul class="panel__list" aria-label="작업 루프">
          <li>
            <span class="tag">Core Loop</span>
            상태 전이를 스토리보드처럼 설계하고 CLI로 반복 작업을 줄여 실험 속도를 유지합니다.
          </li>
          <li>
            <span class="tag">IME Systems</span>
            한국어 조합, 포인터, MIDI 이벤트를 입력 파이프라인 하나로 묶어 까다로운 UX를 타입으로 검증합니다.
          </li>
          <li>
            <span class="tag">DX Stack</span>
            TypeScript · React/Vue · TanStack Query · Bun/pnpm · Changesets 기반 모노레포 운영.
          </li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="section section--cases" id="projects" aria-labelledby="projects-heading">
  <div class="container">
    <div class="section__header">
      <p class="section__eyebrow">Signature work</p>
      <h2 id="projects-heading">실사용 제품으로 검증한 빌드들</h2>
      <p class="section__intro">인터랙션 문제와 DX 자동화를 동시에 해결한 프로젝트들입니다.</p>
    </div>
    <div class="case-grid" role="list">
      <article class="case-card" role="listitem">
        <div class="case-card__head">
          <div>
            <p class="badge">virtual-keyboard</p>
            <h3>한국어 IME 난제 해결</h3>
          </div>
          <a class="case-card__cta" href="https://github.com/uiwwsw/virtual-keyboard" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p class="case-card__summary">Composition 이벤트와 커스텀 키보드를 상태 머신 하나로 묶어 모바일 네이티브 키보드가 끼어들 틈을 줄였습니다.</p>
        <ul class="pill-list">
          <li>React 가상 키보드</li>
          <li>IME Latency Guard</li>
          <li>Storybook + Typedoc 배포</li>
        </ul>
        <div class="case-card__links" aria-label="관련 링크">
          <a href="https://github.com/uiwwsw/virtual-keyboard-storybook" target="_blank" rel="noopener">storybook 패키지</a>
        </div>
      </article>
      <article class="case-card" role="listitem">
        <div class="case-card__head">
          <div>
            <p class="badge">react-query-helper</p>
            <h3>DX 자동화</h3>
          </div>
          <a class="case-card__cta" href="https://github.com/uiwwsw/react-query-helper" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p class="case-card__summary">OpenAPI 스키마로 React Query 훅·옵션·테스트를 생성해 팀 캐싱 전략을 코드로 기록합니다.</p>
        <ul class="pill-list">
          <li>Watch Mode Scaffold</li>
          <li>Bun · pnpm 지원</li>
          <li>Changesets 릴리스</li>
        </ul>
        <div class="case-card__links" aria-label="관련 링크">
          <a href="https://github.com/uiwwsw/react-query-helper-templates" target="_blank" rel="noopener">템플릿</a>
          <a href="https://github.com/uiwwsw/react-query-helper-docs" target="_blank" rel="noopener">Storybook · Docs</a>
        </div>
      </article>
      <article class="case-card" role="listitem">
        <div class="case-card__head">
          <div>
            <p class="badge">koreanscript</p>
            <h3>언어 실험</h3>
          </div>
          <a class="case-card__cta" href="https://github.com/uiwwsw/koreanscript" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p class="case-card__summary">한글 키워드 기반 TypeScript 트랜스파일러를 만들어 --check 타입 검증과 인터랙티브 플레이그라운드를 붙였습니다.</p>
        <ul class="pill-list">
          <li>AST Transform</li>
          <li>Playground Deploy</li>
          <li>Type-level Spec</li>
        </ul>
        <div class="case-card__links" aria-label="관련 링크">
          <a href="https://github.com/uiwwsw/koreanscript-playground" target="_blank" rel="noopener">Playground</a>
        </div>
      </article>
    </div>
    <div class="case-grid" role="list">
      <article class="case-card" role="listitem">
        <div class="case-card__head">
          <div>
            <p class="badge">visual-novel</p>
            <h3>스토리텔링 툴링</h3>
          </div>
          <a class="case-card__cta" href="https://github.com/uiwwsw/visual-novel" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p class="case-card__summary">JSON 시나리오, 자산 매핑, 저장/불러오기를 갖춘 웹 비주얼 노블 엔진으로 바로 서사를 실험합니다.</p>
        <ul class="pill-list">
          <li>Scene Graph Runtime</li>
          <li>State Sync Layer</li>
          <li>Cloud Save Hook</li>
        </ul>
        <div class="case-card__links" aria-label="관련 링크">
          <a href="https://github.com/uiwwsw/visual-novel-assets" target="_blank" rel="noopener">Asset Pack</a>
        </div>
      </article>
      <article class="case-card" role="listitem">
        <div class="case-card__head">
          <div>
            <p class="badge">cushion.ai</p>
            <h3>AI 상담 파이프라인</h3>
          </div>
          <a class="case-card__cta" href="https://github.com/uiwwsw/cushion-ai" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p class="case-card__summary">Ionic + NestJS 모노레포에서 상담 예약, 구독 결제, AI 세션 요약을 연결해 운영팀과 사용자 경험을 동시에 개선했습니다.</p>
        <ul class="pill-list">
          <li>구독/크레딧 정책</li>
          <li>pnpm Workspace</li>
          <li>유효성 스키마 공유</li>
        </ul>
        <div class="case-card__links" aria-label="관련 링크">
          <a href="https://github.com/uiwwsw/cushion-ai-designkit" target="_blank" rel="noopener">Design Kit</a>
        </div>
      </article>
      <article class="case-card" role="listitem">
        <div class="case-card__head">
          <div>
            <p class="badge">dx-playbook</p>
            <h3>Docs · Storybook 자동화</h3>
          </div>
          <a class="case-card__cta" href="https://github.com/uiwwsw/dx-playbook" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p class="case-card__summary">Storybook, Typedoc, Lighthouse 리포트를 같은 Actions 파이프라인에서 배포해 인터랙션 실험과 문서화를 동시에 추적합니다.</p>
        <ul class="pill-list">
          <li>Turbo + Changesets</li>
          <li>QA Report Upload</li>
          <li>Reusable Recipes</li>
        </ul>
        <div class="case-card__links" aria-label="관련 링크">
          <a href="https://github.com/uiwwsw/dx-playbook-actions" target="_blank" rel="noopener">Actions</a>
          <a href="https://github.com/uiwwsw/dx-playbook-recipes" target="_blank" rel="noopener">Recipes</a>
        </div>
      </article>
    </div>
  </div>
</section>

<section class="section section--pipeline" aria-labelledby="pipeline-heading">
  <div class="container pipeline">
    <div class="pipeline__block">
      <p class="section__eyebrow">Operating System</p>
      <h2 id="pipeline-heading">입력부터 배포까지 한 파이프라인</h2>
      <ul class="timeline" aria-label="작업 루틴">
        <li>
          <div class="timeline__title">Input orchestration</div>
          <p>가상 키보드와 하드웨어 입력을 통합한 Guard Layer로 IME 오류와 병목을 테스트로 검증합니다.</p>
        </li>
        <li>
          <div class="timeline__title">Design system as product</div>
          <p>토큰, 문서, 상호작용 시나리오를 모노레포 단일 소스로 관리하고 Storybook/Typedoc으로 동시 배포합니다.</p>
        </li>
        <li>
          <div class="timeline__title">Automation first</div>
          <p>CLI/코드 생성기로 스캐폴딩, 테스트, 릴리스를 자동화해 실험 속도를 떨어뜨리지 않는 것을 우선합니다.</p>
        </li>
      </ul>
    </div>
    <div class="pipeline__block pipeline__grid">
      <div class="card">
        <p class="section__eyebrow">Toolchain</p>
        <h3>재사용 가능한 DX 스택</h3>
        <ul class="stack-list">
          <li><span class="tag">TypeScript 5.x</span> 모노레포 워크플로와 타입 세이프 API 계약</li>
          <li><span class="tag">TanStack Query</span> 캐싱 정책을 코드 생성으로 관리</li>
          <li><span class="tag">Bun · pnpm</span> 빠른 실행과 패키지 격리</li>
          <li><span class="tag">Changesets</span> 팀 스케일 릴리스 관리</li>
        </ul>
      </div>
      <div class="card">
        <p class="section__eyebrow">Recent Signal</p>
        <h3>Build Health</h3>
        <dl class="metrics">
          <div>
            <dt>Storybook</dt>
            <dd>UI/UX 실험과 문서를 동일한 배포 파이프라인으로 운영</dd>
          </div>
          <div>
            <dt>IME Latency</dt>
            <dd>가상 키보드/Composition 이벤트 지연을 Guard Layer로 차단</dd>
          </div>
          <div>
            <dt>QA Upload</dt>
            <dd>Lighthouse · Typedoc · Playwright 리포트를 PR마다 아티팩트로 게시</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</section>
