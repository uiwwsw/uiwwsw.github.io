---
layout: default
title: prisma + nextjs => 머랭트립 군집 지도
description: 복수 조건 기반 군집 검색 지도 앱인 머랭트립을 Prisma + Next.js로 구현하며 얻은 실전 경험을 정리했습니다.
tags:
  - Prisma
  - Next.js
  - MeringTrip
---

<div class="container">
  <header class="section">
    <h1 class="hero__title" style="font-size:2.6rem;">prisma + nextjs =&gt; 머랭트립 군집 지도</h1>
    <p class="section__intro">카페·스터디룸·식당을 한 번에 입력하면, 조건이 겹치는 최적 구역을 자동으로 찾아주는 머랭트립을 Prisma + Next.js로 빌드한 회고입니다. "찐리뷰"처럼, 구현 디테일과 운영 후기를 솔직하게 남깁니다.</p>
  </header>

  <article class="section">
    <h2 class="section__title">데이터 스키마를 군집 중심으로 설계</h2>
    <p>Prisma 스키마를 설계할 때부터 <strong>개별 장소</strong>보다 <strong>군집</strong>을 우선시했습니다. <code>Place</code> 모델은 카테고리와 좌표만 최소로 유지하고, <code>Cluster</code> 모델이 여러 Place를 연결하도록 구성했습니다. 덕분에 Next.js 서버 액션에서 "카페 + 스터디룸 + 지하철역 10분" 같은 복합 조건을 쿼리하면, Prisma가 군집별 집계 결과를 타입 안전하게 반환해주었습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">Next.js로 한 번의 검색 경험 완성</h2>
    <p>App Router 기반의 서버 컴포넌트에서 Prisma 쿼리를 직접 호출해, "검색어 여러 번 바꾸기"라는 기존 지도의 번거로움을 없앴습니다. 사용자가 조건을 입력하면 서버에서 즉시 군집 점수를 계산하고, 클라이언트는 상위 N개 군집만 하이라이트합니다. UI는 핀을 잔뜩 뿌리는 대신 "여기가 조건이 가장 잘 겹치는 구역"이라는 메시지를 강조하는 식으로 배치했습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">리뷰 플랫폼에서 얻은 교훈 재활용</h2>
    <p>기존 "prisma + nextjs =&gt; 찐리뷰" 프로젝트의 경험을 그대로 옮겼습니다. 백엔드 타입을 프론트에 공유해 API DTO를 별도로 만들지 않았고, 즐겨찾기나 블라인드 처리처럼 리뷰 정책에서 쓰던 토글 로직을 군집 가중치 시각화에 재활용했습니다. 덕분에 데이터 불일치나 과도한 변환 비용 없이 빠르게 MVP를 완성할 수 있었습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">운영 후기에 대한 솔직한 메모</h2>
    <p>베타 테스트 기간 동안 "스터디 모임하기 좋은 동네" 같은 시나리오에서 만족도가 높았지만, 실제 운영에서는 카테고리 데이터의 품질과 장소 업데이트 주기가 가장 큰 리스크였습니다. 앞으로는 <strong>장소 검증 자동화</strong>와 <strong>주기적인 군집 재계산</strong>을 추가해, 사용자가 매번 검색어를 기억하거나 핀을 겹쳐볼 필요 없는 경험을 더 탄탄하게 만들 예정입니다.</p>
  </article>
</div>
