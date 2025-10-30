---
layout: default
title: WebGL 기반 지도 렌더링 파이프라인 재구성
description: GeoJSON 전처리와 타일 스트리밍으로 WebGL 지도 성능을 끌어올린 과정을 공유합니다.
tags:
  - Mapbox
  - Performance
  - WebGL
---

<div class="container">
  <header class="section">
    <h1 class="hero__title" style="font-size:2.6rem;">WebGL 기반 지도 렌더링 파이프라인 재구성</h1>
    <p class="section__intro">지도 화면이 이동할 때마다 프레임 드랍이 발생해 현장 사용자가 겪는 불편이 컸습니다. 데이터 구조부터 렌더링 전략까지 다시 설계한 기록입니다.</p>
  </header>

  <article class="section">
    <h2 class="section__title">기존 구조의 한계</h2>
    <p>하나의 거대한 GeoJSON을 클라이언트에서 파싱하는 방식은 초기 로딩과 이동 중 모두 병목이 발생했습니다. CPU 파싱 시간만 1.5초 이상 걸렸고, WebGL 컨텍스트는 매 이동마다 과도한 레이어 업데이트를 수행했습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">새로운 파이프라인</h2>
    <ol class="timeline">
      <li class="timeline-item">데이터를 행정 구역 단위로 분할하고, <strong>tippecanoe</strong>로 벡터 타일을 생성했습니다.</li>
      <li class="timeline-item">타일 메타 데이터를 CDN에 배포해 필요한 범위만 스트리밍했습니다.</li>
      <li class="timeline-item">Mapbox 레이어를 뷰포트에 따라 지연 로드하고, interaction 레이어를 분리해 반응성을 확보했습니다.</li>
    </ol>
  </article>

  <article class="section">
    <h2 class="section__title">체감 성능</h2>
    <p>초기 로딩은 3.2초 → 1.1초로 단축됐고, 이동 중 FPS는 24 → 40으로 개선됐습니다. 특히 터치 인터랙션 반응 속도가 즉각적으로 올라 사용자 피드백이 긍정적으로 바뀌었습니다.</p>
  </article>
</div>
