---
layout: default
title: Matthew Yoon — 윤창원
full_bleed: true
---

<section class="hero" id="intro" aria-labelledby="intro-heading">
  <div class="container hero__grid">
    <div class="hero__intro">
      <p class="eyebrow">윤창원 · Matthew Yoon</p>
      <h1 id="intro-heading" class="hero__title">프런트엔드 개발자로서 실제 문제를 해결하는 데 집중해 왔습니다.</h1>
      <p class="hero__lede">
        한국어 IME처럼 처리 과정이 복잡한 입력 시스템, 문서·컴포넌트·데이터가 분리되지 않는 개발 구조, 그리고 반복되는 작업을 자동화하는
        도구들을 만들며 팀의 생산성을 높여 왔습니다.
      </p>
      <div class="hero__chips" aria-label="현재 포커스">
        <span class="chip chip--solid">10년 차 프런트엔드</span>
        <span class="chip">입력 시스템</span>
        <span class="chip">디자인 시스템</span>
        <span class="chip">자동화</span>
      </div>
      <div class="hero__actions" role="group" aria-label="바로 가기">
        <a class="button button--primary" href="#projects">최근 작업 보기</a>
        <a class="button button--ghost" href="https://velog.io/@uiwwsw" target="_blank" rel="noopener">Velog에서 읽기</a>
      </div>
    </div>
    <div class="hero__panel" aria-label="Workboard snapshot">
      <div class="panel-card">
        <h2 class="panel-card__title">진행 중인 프로젝트</h2>
        <ul class="signal-list">
          <li class="signal-item">
            <span class="signal-dot" aria-hidden="true"></span>
            <div>
              <h3>IME + 입력 가드 레이어</h3>
              <p>가상 키보드와 하드웨어 입력을 동일한 파이프라인으로 검증하고, Composition 이벤트 충돌을 줄이는 안정화 레이어를 구축.</p>
            </div>
          </li>
          <li class="signal-item">
            <span class="signal-dot" aria-hidden="true"></span>
            <div>
              <h3>Storybook / Typedoc 통합 문서화</h3>
              <p>컴포넌트 데모와 타입 문서를 모노레포 기준 하나의 파이프라인으로 배포해 문서·디자인·코드 싱크를 유지.</p>
            </div>
          </li>
          <li class="signal-item">
            <span class="signal-dot" aria-hidden="true"></span>
            <div>
              <h3>CLI · 코드 생성 자동화</h3>
              <p>OpenAPI 스키마 기반으로 React Query 훅, 타입, 테스트 스캐폴딩을 자동 생성해 팀 전체 API 사용 패턴과 캐싱 전략을 일관되게 유지.</p>
            </div>
          </li>
        </ul>
        <div class="metrics-grid" aria-label="현재 스택">
          <div class="metric-card">
            <p class="metric-title">Stack</p>
            <p class="metric-value">TypeScript · React/Vue · Bun/pnpm</p>
          </div>
          <div class="metric-card">
            <p class="metric-title">Habits</p>
            <p class="metric-value">Scene Graph · Playbook 기반 시나리오</p>
          </div>
          <div class="metric-card">
            <p class="metric-title">Deploy</p>
            <p class="metric-value">Storybook · Typedoc · CI 배포 자동화</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="projects" aria-labelledby="projects-heading">
  <div class="container">
    <div class="section__header">
      <p class="section__eyebrow">Recent work</p>
      <h2 id="projects-heading" class="section__title">최근 작업들</h2>
      <p class="section__intro">팀의 생산성을 높이고, 입력 경험과 문서 싱크를 안정적으로 유지하기 위해 진행했던 프로젝트를 정리했습니다.</p>
    </div>
    <div class="card-grid" role="list">
      <article class="feature-card" role="listitem">
        <div class="feature-card__header">
          <div class="feature-card__identity">
            <span class="feature-card__icon" aria-hidden="true"></span>
            <div>
              <p class="badge">meringuetrip</p>
              <h3 class="feature-card__title">머랭트립 군집 지도</h3>
            </div>
          </div>
          <a class="link-pill" href="https://brewstar-code.github.io/meringuetrip/" target="_blank" rel="noopener">Demo</a>
        </div>
        <p class="feature-card__description">React(Ionic) + Cloudflare로 다중 조건 필터링이 가능한 위치 기반 검색 지도를 구축했습니다. Cloudflare Worker에서 군집 점수를 계산해 교차 조건에 해당하는 구역만 시각적으로 표시합니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">React · Ionic</li>
          <li class="tag">Cloudflare Worker</li>
          <li class="tag">D1 · KV</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__header">
          <div class="feature-card__identity">
            <span class="feature-card__icon" aria-hidden="true"></span>
            <div>
              <p class="badge">real-review</p>
              <h3 class="feature-card__title">찐리뷰</h3>
            </div>
          </div>
          <a class="link-pill" href="/2025/01/05/prisma-nextjs-real-review.html">회고</a>
        </div>
        <p class="feature-card__description">Prisma 스키마를 Next.js와 공유하여 타입 변환 비용을 줄인 리뷰 플랫폼입니다. 좋아요/싫어요 기반 가중치를 적용해 신뢰도 높은 리뷰만 노출되도록 설계했습니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">Prisma</li>
          <li class="tag">Next.js</li>
          <li class="tag">PostgreSQL</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__header">
          <div class="feature-card__identity">
            <span class="feature-card__icon" aria-hidden="true"></span>
            <div>
              <p class="badge">prepay</p>
              <h3 class="feature-card__title">프리페이</h3>
            </div>
          </div>
          <a class="link-pill" href="/2025/01/07/prepay-qrcode-prepay.html">MVP 기록</a>
        </div>
        <p class="feature-card__description">QR 기반으로 사용 기록을 자동 저장하는 MVP를 제작했습니다. 점주는 별도 입력 없이 사용 내역을 조회할 수 있습니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">Next.js</li>
          <li class="tag">QR 인증</li>
          <li class="tag">MVP</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__header">
          <div class="feature-card__identity">
            <span class="feature-card__icon" aria-hidden="true"></span>
            <div>
              <p class="badge">virtual-keyboard</p>
              <h3 class="feature-card__title">한국어 IME 가상 키보드</h3>
            </div>
          </div>
          <a class="link-pill" href="https://github.com/uiwwsw/virtual-keyboard" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p class="feature-card__description">Composition 이벤트와 사용자 정의 키보드를 상태 머신으로 묶어 모바일 입력 간섭을 최소화했습니다. 지연(latency)이 발생하면 테스트 레이어에서 즉시 기록해 개선합니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">React</li>
          <li class="tag">IME Latency Guard</li>
          <li class="tag">Storybook · Typedoc</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__header">
          <div class="feature-card__identity">
            <span class="feature-card__icon" aria-hidden="true"></span>
            <div>
              <p class="badge">react-query-helper</p>
              <h3 class="feature-card__title">캐싱 전략 자동화</h3>
            </div>
          </div>
          <a class="link-pill" href="https://github.com/uiwwsw/react-query-helper" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p class="feature-card__description">OpenAPI 스키마를 기반으로 React Query 훅과 테스트 템플릿을 자동 생성합니다. Bun/pnpm 환경에서 모노레포 전체에서 동일한 캐싱 규칙을 적용합니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">TypeScript</li>
          <li class="tag">Bun · pnpm</li>
          <li class="tag">Changesets</li>
        </ul>
      </article>
    </div>
  </div>
</section>

<section class="section" id="operating" aria-labelledby="pipeline-heading">
  <div class="container grid-two">
    <div class="surface-block">
      <p class="section__eyebrow">Work way</p>
      <h2 id="pipeline-heading" class="section__title">입력부터 문서화·배포까지 한 흐름으로 연결</h2>
      <ul class="timeline" aria-label="작업 루틴">
        <li class="timeline__item">
          <p class="timeline__title">입력 처리</p>
          <p class="timeline__desc">한국어 IME처럼 복잡한 입력 시스템을 가상 키보드와 동일한 파이프라인으로 검증하고, Composition 이벤트 충돌을 줄입니다.</p>
        </li>
        <li class="timeline__item">
          <p class="timeline__title">디자인 시스템 운영</p>
          <p class="timeline__desc">토큰·문서·데모를 하나의 모노레포에서 관리하고 Storybook/Typedoc으로 함께 배포해 항상 최신 상태를 유지합니다.</p>
        </li>
        <li class="timeline__item">
          <p class="timeline__title">자동화</p>
          <p class="timeline__desc">OpenAPI 스키마 기반 CLI와 코드 생성기로 반복 작업을 줄이고, 팀 전체에 일관된 API 사용과 캐싱 전략을 퍼뜨립니다.</p>
        </li>
      </ul>
    </div>
    <div class="stack">
      <p class="section__eyebrow">Toolkit</p>
      <h3 class="stack__title">재사용 가능한 스택</h3>
      <ul class="stack__list">
        <li><strong>TypeScript 5.x</strong> — 모노레포 워크플로, 타입 안전한 API 계약</li>
        <li><strong>TanStack Query</strong> — 캐싱 정책을 템플릿과 코드 생성기로 관리</li>
        <li><strong>Bun · pnpm</strong> — 빠른 실행과 패키지 격리</li>
        <li><strong>Storybook · Typedoc</strong> — UI/UX 실험과 문서를 동일한 배포 경로로 유지</li>
      </ul>
      <div class="card-footer">
        <a class="link-pill" href="https://github.com/uiwwsw" target="_blank" rel="noopener">GitHub 더보기</a>
        <a class="link-pill" href="mailto:uiwwsw@gmail.com">협업 제안</a>
      </div>
    </div>
  </div>
</section>

