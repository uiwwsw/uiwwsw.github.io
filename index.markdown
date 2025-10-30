---
layout: default
title: Matthew Kim — Brewstar
---

<div class="container">
  <section class="hero">
    <div>
      <p class="hero__eyebrow">Matthew Kim / Brewstar</p>
      <h1 class="hero__title">오프라인도 견디는 경험을 설계하는 프론트엔드 엔지니어</h1>
      <p class="hero__subtitle">TypeScript · React · Ionic으로 오프라인 퍼스트, 지도 · 위치 중심의 프로덕트를 만듭니다. 복잡한 시스템을 정성 들여 끓여, 결국 명료한 한 잔으로 내리는 것이 제 일입니다.</p>
    </div>
    <div class="hero__grid">
      <article class="hero__card">
        <h3>현재</h3>
        <p>지도 데이터와 위치 기반 경험을 설계하며, 연결이 느려도 멈추지 않는 프로덕트를 다룹니다.</p>
        <p>최근에는 PWA 캐싱 전략과 실시간 좌표 동기화로 사용자 체감을 40% 이상 개선했습니다.</p>
      </article>
      <article class="hero__card">
        <h3>관심</h3>
        <p>사용자의 현실 세계 맥락과 맞닿아 있는 UI, 성능이 드러나는 인터랙션, 그리고 협업이 쉬운 DX에 집중합니다.</p>
        <p>읽고, 기록하고, 공유하는 과정을 자동화하여 팀 전체의 속도를 높이는 일에 기여합니다.</p>
      </article>
      <article class="hero__card">
        <h3>철학</h3>
        <p>“코드는 짧게, 경험은 길게. 결과는 명료하게.” 복잡을 품되, 사용자에게는 단순하고 빠른 순간만을 남깁니다.</p>
      </article>
    </div>
  </section>

  <section id="focus" class="section">
    <h2 class="section__title">Core Focus</h2>
    <p class="section__intro">빠르게 변하는 현실 환경에서도 끊김 없는 UX를 만들기 위해, 다음 네 가지 축을 중심으로 고민합니다.</p>
    <div class="focus-grid">
      <article class="focus-card">
        <h3>오프라인 퍼스트 설계</h3>
        <p>서비스 워커 · IndexedDB · background sync로 연결 품질이 낮아도 흐름이 이어지도록 만듭니다.</p>
        <ul>
          <li>PWA 캐싱 전략</li>
          <li>데이터 동기화</li>
          <li>Fallback UX</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>지도 & 위치 인터랙션</h3>
        <p>좌표 기반 탐색과 경로 안내를 위해 지도 SDK와 WebGL을 다루고, 공간 경험을 인터페이스에 녹입니다.</p>
        <ul>
          <li>Mapbox GL</li>
          <li>GeoJSON 파이프라인</li>
          <li>위치 추적 안정화</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>프론트엔드 성능 최적화</h3>
        <p>정량화된 지표를 바탕으로 렌더링과 네트워크 비용을 줄여, 모바일 환경에서도 빠르게 응답하는 UI를 만듭니다.</p>
        <ul>
          <li>React Server Components</li>
          <li>Progressive Rendering</li>
          <li>Bundle Analyzer</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>Developer Experience</h3>
        <p>CI 파이프라인과 문서화를 자동화해 팀 동료들이 쉽게 기여할 수 있는 환경을 구축합니다.</p>
        <ul>
          <li>Lint & Format 자동화</li>
          <li>Design Token 시스템</li>
          <li>Storybook 워크플로</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="worklog" class="section">
    <h2 class="section__title">Work Log</h2>
    <p class="section__intro">최근 작업과 학습을 타임라인으로 정리했습니다. 기록은 문제 맥락, 의사 결정, 그리고 남은 질문까지 포함합니다.</p>
    <div class="timeline">
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2024.04</span>
          <span>Offline Sync</span>
        </div>
        <h3 class="timeline-item__title">멀티 디바이스 오프라인 작업 동기화</h3>
        <p class="timeline-item__summary">Service Worker + BroadcastChannel 조합으로 저장소 상태를 공유하고, 충돌 해결 전략을 명시했습니다. 사용자 재접속 시 평균 동기화 시간이 1.8초까지 내려갔습니다.</p>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2024.02</span>
          <span>Map Performance</span>
        </div>
        <h3 class="timeline-item__title">지형 레이어 WebGL 최적화</h3>
        <p class="timeline-item__summary">GeoJSON을 타일로 전처리하고, 필요 영역만 스트리밍하여 이동 중 프레임 드랍을 70% 줄였습니다.</p>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2023.12</span>
          <span>DX Upgrade</span>
        </div>
        <h3 class="timeline-item__title">Monorepo 전환과 자동 릴리즈</h3>
        <p class="timeline-item__summary">pnpm workspace 기반으로 패키지를 분리하고, Changeset으로 배포 파이프라인을 표준화했습니다. PR당 배포 준비 시간이 60% 단축됐습니다.</p>
      </article>
    </div>
  </section>

  <section id="projects" class="section">
    <h2 class="section__title">Selected Projects</h2>
    <p class="section__intro">사용자의 위치와 맥락이 결합된 경험을 설계하며 얻은 결과물들입니다.</p>
    <div class="project-grid">
      <article class="project-card">
        <span class="project-card__meta">2023 — Product</span>
        <h3 class="project-card__title"><a href="/meringuetrip">Meringue Trip</a></h3>
        <p class="project-card__description">여행자를 위한 위치 기반 탐색 서비스. 오프라인 지도 캐시와 동적 추천으로 네트워크 상황과 무관하게 일정이 이어집니다.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>Ionic</li>
          <li>PWA</li>
        </ul>
      </article>
      <article class="project-card">
        <span class="project-card__meta">2024 — Tooling</span>
        <h3 class="project-card__title">Field Insight Console</h3>
        <p class="project-card__description">현장 기기 상태를 실시간으로 모니터링하는 콘솔. WebSocket 스트림과 캐시 계층으로 1초 미만 갱신을 유지합니다.</p>
        <ul class="project-card__tags">
          <li>Next.js</li>
          <li>Recharts</li>
          <li>Nx</li>
        </ul>
      </article>
      <article class="project-card">
        <span class="project-card__meta">2022 — Library</span>
        <h3 class="project-card__title">Atlas UI Kit</h3>
        <p class="project-card__description">지도와 위치 정보를 다루는 컴포넌트 시스템. 디자인 토큰과 Storybook을 통해 팀 간 일관성을 확보했습니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>Storybook</li>
          <li>Turborepo</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="writing" class="section">
    <h2 class="section__title">Latest Writing</h2>
    <p class="section__intro">실제 현장에서 부딪힌 문제와 해결 방식을 정리합니다. 시행착오와 재현 가능한 결과에 집중합니다.</p>
    <div class="post-list">
      {% for post in site.posts limit:3 %}
        <article class="post-card">
          <span class="post-card__meta">{{ post.date | date: '%Y.%m.%d' }} · {{ post.tags | join: ', ' }}</span>
          <h3 class="post-card__title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
          <p class="post-card__excerpt">{{ post.excerpt | strip_html | truncate: 160 }}</p>
        </article>
      {% endfor %}
      {% if site.posts == empty %}
        <p>곧 기록을 올릴 예정입니다.</p>
      {% endif %}
    </div>
  </section>
</div>
