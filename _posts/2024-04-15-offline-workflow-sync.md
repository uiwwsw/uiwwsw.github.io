---
layout: default
title: 오프라인 작업 흐름을 지키는 동기화 전략
description: Service Worker와 BroadcastChannel을 활용해 오프라인 상태에서도 끊김 없는 협업을 구현한 과정을 정리했습니다.
tags:
  - Offline-first
  - Service Worker
  - DX
---

<div class="container">
  <header class="section">
    <h1 class="hero__title" style="font-size:2.6rem;">오프라인 작업 흐름을 지키는 동기화 전략</h1>
    <p class="section__intro">불안정한 연결에서 동시에 작업하는 사용자가 많아지며, 충돌 없는 데이터 경험이 필수가 되었습니다. 이 글에서는 저장소 구조 설계부터 동기화 파이프라인, 그리고 UI 피드백까지 정리합니다.</p>
  </header>

  <article class="section">
    <h2 class="section__title">문제 정의</h2>
    <p>필드 엔지니어는 지하나 외곽 지역에서도 작업을 이어가야 했고, 상호 간 작업 내역을 실시간으로 공유해야 했습니다. 기존에는 온라인 상태에서만 데이터 저장이 가능했고, 오프라인에서 발생한 변경사항은 모두 메모에 기록한 뒤 수동으로 입력해야 했습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">설계 포인트</h2>
    <ul class="focus-card">
      <li><strong>IndexedDB 다중 버전 관리</strong>로 네트워크 재개 시 충돌을 최소화합니다.</li>
      <li><strong>Service Worker의 Background Sync</strong>로 앱이 포그라운드에 있지 않아도 업로드를 이어갑니다.</li>
      <li><strong>BroadcastChannel</strong>을 통해 여러 탭에서 동일한 상태를 바라보게 합니다.</li>
    </ul>
  </article>

  <article class="section">
    <h2 class="section__title">결과</h2>
    <p>재접속 후 평균 동기화 시간은 1.8초까지 감소했고, 충돌 재시도가 필요한 비율은 7% → 2%로 줄었습니다. 사용자는 “연결을 기다리지 않는 경험”이라고 표현했습니다. 이후 이 전략은 다른 프로젝트의 템플릿으로 확장되었습니다.</p>
  </article>
</div>
