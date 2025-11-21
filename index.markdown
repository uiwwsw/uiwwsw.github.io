---
layout: default
title: Matthew Yoon — 윤창원
full_bleed: true
---

<section class="hero" id="intro" aria-labelledby="intro-heading">
  <div class="container hero__grid">
    <div class="hero__intro">
      <p class="eyebrow">윤창원 · Matthew Yoon</p>
      <h1 id="intro-heading" class="hero__title">현장에서 겪은 문제를 직접 해결하는 프런트엔드 개발자입니다.</h1>
      <p class="hero__lede">
        번역기 돌린 문구 대신, 실제로 겪은 일을 남깁니다. 한국어 IME 같은 까다로운 입력, 문서와 코드가 따로 놀지 않게 만드는 자동화,
        팀이 바로 써볼 수 있는 도구를 꾸준히 빌드합니다.
      </p>
      <div class="hero__chips" aria-label="현재 포커스">
        <span class="chip chip--solid">10년차 프런트엔드</span>
        <span class="chip">입력 경험</span>
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
        <h2 class="panel-card__title">현재 운용 중</h2>
        <ul class="signal-list">
          <li class="signal-item">
            <span class="signal-dot" aria-hidden="true"></span>
            <div>
              <h3>IME + 입력 가드 레이어</h3>
              <p>가상 키보드와 하드웨어 입력을 하나의 파이프라인에서 검증하고 병목을 E2E 테스트로 기록.</p>
            </div>
          </li>
          <li class="signal-item">
            <span class="signal-dot" aria-hidden="true"></span>
            <div>
              <h3>Storybook/Typedoc 동시 배포</h3>
              <p>모노레포에서 토큰, 문서, 상호작용 데모를 같은 Actions 파이프라인으로 올려 지속성 유지.</p>
            </div>
          </li>
          <li class="signal-item">
            <span class="signal-dot" aria-hidden="true"></span>
            <div>
              <h3>CLI · 코드 생성 자동화</h3>
              <p>React Query 훅, 옵션, 테스트를 OpenAPI 스키마 기반으로 생성해 캐싱 전략을 코드로 공유.</p>
            </div>
          </li>
        </ul>
        <div class="metrics-grid" aria-label="현재 스택">
          <div class="metric-card">
            <p class="metric-title">Stack</p>
            <p class="metric-value">TypeScript · React/Vue · pnpm</p>
          </div>
          <div class="metric-card">
            <p class="metric-title">Habits</p>
            <p class="metric-value">Scene Graph sketch · Playbook</p>
          </div>
          <div class="metric-card">
            <p class="metric-title">Deploy</p>
            <p class="metric-value">Storybook · Typedoc · QA Report</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="profile" aria-labelledby="profile-heading">
  <div class="container grid-two">
    <div class="surface-block">
      <p class="section__eyebrow">Profile</p>
      <h2 id="profile-heading" class="section__title">문제 정의부터 책임 있는 AI 운영까지</h2>
      <p class="section__intro">문제를 정의하고 제약을 명료화하며, AI 목표를 오케스트레이션해 책임 있는 의사결정 체계를 설계·운영합니다.</p>
    </div>
    <div class="stack" aria-label="주요 역할">
      <h3 class="stack__title">하는 일</h3>
      <ul class="stack__list">
        <li><strong>문제 정의·본질 파악 전문가</strong> — 표면적 현상보다 구조적 원인을 정확히 짚어내 핵심 쟁점을 선명히 합니다.</li>
        <li><strong>제약 조건 설계자</strong> — 예산·성능·보안·규제 등 현실적 제약을 명료화해 실현 가능한 솔루션만 남기는 프레임을 만듭니다.</li>
        <li><strong>AI 오케스트레이터</strong> — 데이터 품질, 모델 지표, 서비스 KPI를 연결해 AI에게 “무엇을, 어떻게” 할지 분명한 목표와 조건을 제시합니다.</li>
        <li><strong>의사결정 구조 설계자</strong> — 인간·AI 역할 분담, 승인 절차, 모니터링 기준을 설계해 일관되고 재현 가능한 판단 흐름을 만듭니다.</li>
        <li><strong>Responsible AI 리더</strong> — 투명성·공정성·안전성 원칙을 지키며 위험 평가와 거버넌스 프로세스를 책임 있게 운영합니다.</li>
      </ul>
    </div>
  </div>
</section>

<section class="section" id="projects" aria-labelledby="projects-heading">
  <div class="container">
    <div class="section__header">
      <p class="section__eyebrow">Recent work</p>
      <h2 id="projects-heading" class="section__title">직접 만들고 운영해 본 것들</h2>
      <p class="section__intro">부풀리지 않은 설명만 남겼습니다. 사용자 문제를 줄이고, 팀이 유지할 수 있는 구조를 만들기 위해 했던 일입니다.</p>
    </div>
    <div class="card-grid" role="list">
      <article class="feature-card" role="listitem">
        <div class="feature-card__meta">
          <div>
            <p class="badge">meringuetrip</p>
            <h3>머랭트립 군집 지도</h3>
          </div>
          <a class="link-pill" href="https://brewstar-code.github.io/meringuetrip/" target="_blank" rel="noopener">Demo</a>
        </div>
        <p>React(Ionic) + Cloudflare 조합으로 "카페·스터디룸·지하철역"처럼 복수 조건을 겹쳐보는 군집 검색 지도를 만들었습니다. Cloudflare Worker에서 군집별 점수를 계산해 조건이 겹치는 구역만 하이라이트합니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">React · Ionic</li>
          <li class="tag">Cloudflare Worker</li>
          <li class="tag">D1 · KV</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__meta">
          <div>
            <p class="badge">real-review</p>
            <h3>찐리뷰</h3>
          </div>
          <a class="link-pill" href="/2025/01/05/prisma-nextjs-real-review.html">회고</a>
        </div>
        <p>Prisma 스키마를 Next.js와 공유해 타입 변환을 최소화한 리뷰 플랫폼입니다. 좋아요 많은 리뷰는 강조하고, 싫어요가 몰린 리뷰는 블라인드 처리해 "진짜 후기"만 보이도록 운영했습니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">Prisma</li>
          <li class="tag">Next.js</li>
          <li class="tag">PostgreSQL</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__meta">
          <div>
            <p class="badge">prepay</p>
            <h3>프리페이</h3>
          </div>
          <a class="link-pill" href="/2025/01/07/prepay-qrcode-prepay.html">MVP 기록</a>
        </div>
        <p>QR코드 선불권을 스캔하면 자동으로 사용 이력을 남겨, 가맹점이 수기로 기록하지 않아도 되는 MVP를 만들었습니다. 토스의 선불 결제 정책이 이미 있는 것을 확인해 MVP까지만 진행했습니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">Next.js</li>
          <li class="tag">QR 인증</li>
          <li class="tag">MVP</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__meta">
          <div>
            <p class="badge">virtual-keyboard</p>
            <h3>한국어 IME 가상 키보드</h3>
          </div>
          <a class="link-pill" href="https://github.com/uiwwsw/virtual-keyboard" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p>Composition 이벤트와 커스텀 키보드를 상태 머신으로 묶어 모바일 입력 간섭을 줄였습니다. 지연이 생기면 테스트로 바로 기록해둡니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">React</li>
          <li class="tag">IME Latency Guard</li>
          <li class="tag">Storybook · Typedoc</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__meta">
          <div>
            <p class="badge">react-query-helper</p>
            <h3>캐싱 전략 자동화</h3>
          </div>
          <a class="link-pill" href="https://github.com/uiwwsw/react-query-helper" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p>OpenAPI 스키마로 React Query 훅, 옵션, 테스트를 자동으로 만들고 캐싱 규칙을 코드로 공유했습니다. bun/pnpm 환경에서 돌립니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">TypeScript</li>
          <li class="tag">Bun · pnpm</li>
          <li class="tag">Changesets</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__meta">
          <div>
            <p class="badge">cushion.ai</p>
            <h3>AI 상담 파이프라인</h3>
          </div>
          <a class="link-pill" href="https://github.com/uiwwsw/cushion-ai" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p>Ionic + NestJS 모노레포에서 상담 예약, 구독/크레딧 결제, 세션 요약을 연결했습니다. 운영팀이 반복 입력을 덜 하고, 사용자는 진행 상황을 바로 볼 수 있게 했습니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">pnpm workspace</li>
          <li class="tag">Subscription policy</li>
          <li class="tag">Shared schema</li>
        </ul>
      </article>

      <article class="feature-card" role="listitem">
        <div class="feature-card__meta">
          <div>
            <p class="badge">dx-playbook</p>
            <h3>Docs · Storybook 동기화</h3>
          </div>
          <a class="link-pill" href="https://github.com/uiwwsw/dx-playbook" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p>Storybook, Typedoc, Lighthouse 리포트를 같은 Actions 파이프라인으로 묶어뒀습니다. 실험 코드와 문서가 함께 배포돼서 서로 어긋나지 않습니다.</p>
        <ul class="tag-list" aria-label="기술 스택">
          <li class="tag">Turbo · Changesets</li>
          <li class="tag">QA Report Upload</li>
          <li class="tag">Reusable Recipes</li>
        </ul>
      </article>
    </div>
  </div>
</section>

<section class="section" id="operating" aria-labelledby="pipeline-heading">
  <div class="container grid-two">
    <div class="surface-block">
      <p class="section__eyebrow">Work way</p>
      <h2 id="pipeline-heading" class="section__title">입력부터 배포까지, 평소에 하는 순서</h2>
      <ul class="timeline" aria-label="작업 루틴">
        <li class="timeline__item">
          <p class="timeline__title">Input orchestration</p>
          <p class="timeline__desc">가상 키보드와 하드웨어 입력, IME 이벤트를 같은 가드 레이어에서 시험해보고, 타입으로 막을 곳을 명확히 둡니다.</p>
        </li>
        <li class="timeline__item">
          <p class="timeline__title">Design system as product</p>
          <p class="timeline__desc">토큰, 문서, 상호작용 시나리오를 하나의 모노레포에서 관리하고 Storybook/Typedoc으로 함께 배포합니다.</p>
        </li>
        <li class="timeline__item">
          <p class="timeline__title">Automation first</p>
          <p class="timeline__desc">CLI와 코드 생성기로 스캐폴딩, 테스트, 릴리스를 자동화해 시간이 오래 걸리는 단계를 줄입니다.</p>
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
