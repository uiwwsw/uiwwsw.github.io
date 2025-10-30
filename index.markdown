---
layout: default
title: Matthew Yoon — 윤창원
---

<div class="container">
  <section id="profile" class="hero">
    <div class="hero__lead">
      <p class="hero__eyebrow">윤창원 · Matthew Yoon</p>
      <h1 class="hero__title">스토리텔링과 인터랙션을 결합해 살아 움직이는 프론트엔드를 만듭니다.</h1>
      <p class="hero__subtitle">React와 Vue를 넘나들며, 실험적인 UI와 자동화 도구, 그리고 글쓰기로 경험을 설계합니다. 프로젝트마다 "재미"와 "유용"이 교차하는 지점을 집요하게 찾습니다.</p>
      <div class="hero__actions" role="group" aria-label="바로 가기">
        <a class="button" href="#projects">최근 빌드 살펴보기</a>
        <a class="button button--ghost" href="https://velog.io/@uiwwsw" target="_blank" rel="noopener">Velog에서 읽기</a>
      </div>
    </div>
    <div class="hero__grid">
      <article class="hero__card">
        <h3>지금 만드는 것</h3>
        <p>시각적 리듬을 가진 비주얼 노블과, 프론트엔드 퍼즐을 자동으로 풀어 주는 CLI 툴을 병행합니다.</p>
        <p class="hero__note">"코드를 적게 쓰고, 몰입을 오래 남기는 인터랙션"이 목표입니다.</p>
      </article>
      <article class="hero__card">
        <h3>애정 하는 스택</h3>
        <ul class="pill-list">
          <li>TypeScript</li>
          <li>React · React Query</li>
          <li>Vue Composition API</li>
          <li>Vite · Storybook</li>
        </ul>
      </article>
      <article class="hero__card">
        <h3>글을 쓰는 이유</h3>
        <p>velog에서는 UI 설계 과정을, 노션에는 인터랙션 메모를 기록합니다. 기록은 다음 실험의 시나리오가 됩니다.</p>
        <a class="text-link" href="https://velog.io/@uiwwsw" target="_blank" rel="noopener">최근 글 읽기 →</a>
      </article>
    </div>
  </section>

  <section id="capabilities" class="section">
    <h2 class="section__title">Capabilities</h2>
    <p class="section__intro">다양한 플랫폼의 이야기를 인터랙션으로 구현하고, 팀이 재사용할 수 있는 도구와 프로세스를 만듭니다.</p>
    <div class="focus-grid">
      <article class="focus-card">
        <h3>React Narrative Lab</h3>
        <p>상태 기반 연출과 전환을 위해 React와 React Query를 활용합니다. UI 상태 전이를 스토리보드처럼 설계합니다.</p>
        <ul>
          <li>Progressive Rendering</li>
          <li>Declarative Animation</li>
          <li>Interactive Story Flow</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>Vue Playground</h3>
        <p>Composition API로 뷰 모델을 구성하고, 오디오 · 입력 장치 같은 하드웨어 인터랙션을 연결합니다.</p>
        <ul>
          <li>Custom Renderer</li>
          <li>Pinia 상태 설계</li>
          <li>Web Audio Sync</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>Automation & CLI</h3>
        <p>반복되는 프론트엔드 의사결정을 자동화하는 도구를 만듭니다. 팀의 온보딩 시간을 줄이는 것이 목표입니다.</p>
        <ul>
          <li>Scaffolding Script</li>
          <li>API Contract Snapshot</li>
          <li>CI/CD Hooks</li>
        </ul>
      </article>
      <article class="focus-card">
        <h3>Creative Tooling</h3>
        <p>가상 입력 장치와 시각 연출 패키지를 구축해, 누구나 쉽게 다룰 수 있는 인터랙티브 경험을 설계합니다.</p>
        <ul>
          <li>Web Components</li>
          <li>MIDI & Virtual Input</li>
          <li>Design Token Automation</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="worklog" class="section">
    <h2 class="section__title">Project Signals</h2>
    <p class="section__intro">기록은 실패와 성공을 모두 담은 실험일지입니다. 각 항목을 펼쳐 배경과 배운 점을 확인할 수 있습니다.</p>
    <div class="timeline" data-timeline>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2024.06</span>
          <span>Visual Novel</span>
        </div>
        <h3 class="timeline-item__title">Polaroid Syntax — 브라우저 비주얼 노블</h3>
        <p class="timeline-item__summary">React + Canvas로 장면 전환과 스토리 분기를 구성하며, 텍스트/사운드 동기화를 오케스트레이션했습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>대화형 선택지가 늘어날수록 상태 관리가 복잡해져서 XState로 스토리 노드를 선언적으로 관리했습니다. 또한 저사양 기기에서도 60fps를 유지하기 위해 Web Worker로 음성 합성 준비를 분리했습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2024.04</span>
          <span>Automation</span>
        </div>
        <h3 class="timeline-item__title">분산 거래소용 자동 매매 파이프라인</h3>
        <p class="timeline-item__summary">오더북 분석과 안전장치를 분리한 모듈 구조로, 실시간 리밸런싱과 시뮬레이터를 한 CLI에서 다룰 수 있게 했습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>비동기 전략을 Node.js Worker Threads로 격리해 메인 이벤트 루프를 지키고, Slack 알림으로 위험 신호를 시각화했습니다. 전략별 백테스트 결과를 Notion API와 연동해 자동 문서화했습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2024.01</span>
          <span>DX Tooling</span>
        </div>
        <h3 class="timeline-item__title">React Query 자동 생성 CLI</h3>
        <p class="timeline-item__summary">OpenAPI 스키마에서 React Query 훅과 상태 토큰을 즉시 생성하는 CLI. 팀 온보딩 시간을 2일에서 반나절로 단축했습니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>Husky와 Changeset을 연동해 생성된 코드를 린팅/테스트하는 파이프라인을 기본 탑재했습니다. CLI는 Inquirer 기반으로 마법사 UX를 제공하며, 템플릿 엔진으로 EJS 대신 Handlebars를 채택해 헬퍼 확장이 쉬워졌습니다.</p>
        </div>
      </article>
      <article class="timeline-item">
        <div class="timeline-item__meta">
          <span>2023.10</span>
          <span>Creative Input</span>
        </div>
        <h3 class="timeline-item__title">Virtual Keys — 웹 기반 버추얼 키보드</h3>
        <p class="timeline-item__summary">터치와 키보드, MIDI 입력을 하나의 이벤트 흐름으로 묶어 악기/타이핑 전환을 부드럽게 하는 패키지입니다.</p>
        <button class="timeline-item__toggle" type="button" aria-expanded="false">맥락 더 보기</button>
        <div class="timeline-item__detail" hidden>
          <p>Web Audio와 Pointer Events를 묶어 입력 지연을 45% 줄였고, Storybook의 Controls를 활용해 테마를 실시간 테스트했습니다. npm으로 배포하면서 Typedoc 기반 문서를 자동 생성했습니다.</p>
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
      <article class="project-card" data-category="story experience">
        <span class="project-card__meta">2024 · Web Experience</span>
        <h3 class="project-card__title">Polaroid Syntax</h3>
        <p class="project-card__description">스크립트가 장면을 호출하는 비주얼 노블 엔진. React와 Canvas API를 조합해 선택지에 따라 연출이 변합니다.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>XState</li>
          <li>Canvas</li>
        </ul>
      </article>
      <article class="project-card" data-category="automation tooling">
        <span class="project-card__meta">2024 · Fintech Automation</span>
        <h3 class="project-card__title">CryptOrbit</h3>
        <p class="project-card__description">암호화폐 거래 전략을 자동 실행하는 파이프라인. 안전 장치를 CLI 단계에서 미리 설정하도록 UX를 설계했습니다.</p>
        <ul class="project-card__tags">
          <li>Node.js</li>
          <li>Worker Threads</li>
          <li>Event Sourcing</li>
        </ul>
      </article>
      <article class="project-card" data-category="tooling">
        <span class="project-card__meta">2024 · Developer Tool</span>
        <h3 class="project-card__title">rq-create</h3>
        <p class="project-card__description">React Query 요청 코드를 자동 생성하는 CLI 패키지. API 스키마만 있으면 훅, 타입, 테스트가 동시에 만들어집니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>OpenAPI</li>
          <li>CLI</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience tooling">
        <span class="project-card__meta">2023 · Interaction Library</span>
        <h3 class="project-card__title">Virtual Keys</h3>
        <p class="project-card__description">악기와 입력 장치를 아우르는 버추얼 키보드 패키지. Web Audio와 CSS Custom Properties로 테마를 구성합니다.</p>
        <ul class="project-card__tags">
          <li>Vue</li>
          <li>Web Audio</li>
          <li>Storybook</li>
        </ul>
      </article>
      <article class="project-card" data-category="experience story">
        <span class="project-card__meta">2023 · Travel Product</span>
        <h3 class="project-card__title"><a href="/meringuetrip">MeringTrip</a></h3>
        <p class="project-card__description">여행 동선을 시각화하고, 오프라인에서도 이어지는 추천을 제공하는 여행 파트너 서비스.</p>
        <ul class="project-card__tags">
          <li>React</li>
          <li>Ionic</li>
          <li>PWA</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="writing" class="section">
    <h2 class="section__title">Writing & Notes</h2>
    <p class="section__intro">글은 다음 실험을 위한 설계도입니다. velog에선 구현 과정을, 블로그 초안에는 실험 노트를 공유합니다.</p>
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
        <li>React Query CLI로 팀 온보딩 자동화하기</li>
        <li>Canvas 기반 비주얼 노블에서 애니메이션 설계하기</li>
        <li>버추얼 키보드로 멀티 디바이스 입력 다루기</li>
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
