---
layout: default
title: Matthew Yoon — 윤창원
---

<div class="container">
  <section id="profile" class="hero">
    <div class="hero__lead">
      <p class="hero__eyebrow">윤창원 · Matthew Yoon</p>
      <h1 class="hero__title">타입세이프한 인터랙션과 자동화를 동시에 몰아가는 TypeScript 개발자입니다.</h1>
      <p class="hero__subtitle">한국어 IME 같은 까다로운 입력 UX를 직접 라이브러리로 풀고, 팀의 반복 의사결정은 CLI와 코드 생성으로 자동화합니다. 모든 실험의 목표는 “사용자가 느끼는 몰입”과 “팀이 얻는 속도”를 함께 끌어올리는 것입니다.</p>
      <div class="hero__actions" role="group" aria-label="바로 가기">
        <a class="button" href="#projects">최근 빌드 살펴보기</a>
        <a class="button button--ghost" href="https://velog.io/@uiwwsw" target="_blank" rel="noopener">Velog에서 읽기</a>
      </div>
    </div>
    <div class="hero__grid">
      <article class="hero__card">
        <h3>한 줄 소개</h3>
        <p>타입세이프한 프론트엔드와 DX 툴링을 동시에 몰아가는 “인터랙션+자동화” 지향의 TypeScript 개발자.</p>
        <p class="hero__note">가장 어려운 입력/연출 문제를 직접 도구화하고, 팀이 재사용할 수 있게 배포합니다.</p>
      </article>
      <article class="hero__card">
        <h3>지금 집중하는 것</h3>
        <p>한국어 조합을 다루는 가상 키보드, React Query 코드를 자동 생성하는 CLI, 암호화폐 자동투자 프로그램을 병행해 “몰입”과 “속도”를 동시에 높입니다.</p>
        <p class="hero__note">설계 → 구현 → 배포 → 문서화까지 한 묶음으로 움직입니다.</p>
      </article>
      <article class="hero__card">
        <h3>즐겨 쓰는 스택</h3>
        <ul class="pill-list">
          <li>TypeScript</li>
          <li>React · React Query</li>
          <li>Vue · Vite</li>
          <li>Bun · pnpm · Changesets</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="highlights" class="section">
    <h2 class="section__title">Key Signals</h2>
    <p class="section__intro">인터랙션 난제 해결과 DX 자동화를 동시에 밀어붙인 대표 사례 다섯 가지를 요약했습니다.</p>
    <ul class="highlight-list">
      <li><strong>한국어 IME 난제 해결:</strong> <em>virtual-keyboard</em>로 composition 이벤트를 직접 제어하고 모바일 네이티브 키보드를 차단합니다.</li>
      <li><strong>DX 자동화:</strong> <em>react-query-helper</em>가 API 함수에서 React Query 훅·옵션·테스트를 자동 생성해 팀 캐싱 전략을 표준화합니다.</li>
      <li><strong>언어 실험:</strong> <em>koreanscript</em>로 한글 키워드 기반 TypeScript 트랜스파일링과 --check 타입 검증을 지원합니다.</li>
      <li><strong>스토리텔링 툴링:</strong> <em>visual-novel</em>로 JSON 시나리오, 자산 매핑, 저장/불러오기를 갖춘 웹 비주얼 노블 엔진을 배포합니다.</li>
    </ul>
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
          <span>2024.09</span>
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
          <span>2024.08</span>
          <span>Interaction Utility</span>
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
          <span>2024.07</span>
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
          <span>2024.05</span>
          <span>DX Automation</span>
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
          <span>2024.03</span>
          <span>Transpiler</span>
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
          <span>2023.08</span>
          <span>Story Engine</span>
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
      <article class="project-card" data-category="experience tooling">
        <span class="project-card__meta">2024 · Interaction Utility</span>
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
        <span class="project-card__meta">2024 · DX Automation</span>
        <h3 class="project-card__title">react-query-helper</h3>
        <p class="project-card__description">OpenAPI 스키마에서 React Query 훅과 옵션, 테스트 토대를 자동 생성하는 CLI. watch 모드와 템플릿 확장으로 팀 일관성을 확보합니다.</p>
        <ul class="project-card__tags">
          <li>TypeScript</li>
          <li>OpenAPI</li>
          <li>CLI</li>
        </ul>
      </article>
      <article class="project-card" data-category="tooling">
        <span class="project-card__meta">2024 · Language Experiment</span>
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
