---
layout: default
title: prisma + nextjs => 찐리뷰
description: 백엔드 타입을 프론트까지 공유해 상점 리뷰를 투명하게 노출한 프로젝트의 회고입니다.
tags:
  - Prisma
  - Next.js
  - Review
---

<div class="container">
  <header class="section">
    <h1 class="hero__title" style="font-size:2.6rem;">prisma + nextjs =&gt; 찐리뷰</h1>
    <p class="section__intro">백엔드 타입을 프론트까지 그대로 연동해, 모든 상점에 대해 숨김 없는 리뷰를 남기고 볼 수 있게 만든 서비스 회고입니다. 2025년 초 현재, 약 6개월 운영 후 중지된 상태입니다.</p>
  </header>

  <article class="section">
    <h2 class="section__title">백엔드 타입을 프론트까지</h2>
    <p>Prisma 스키마로 정의된 타입을 Next.js 애플리케이션의 전역 타입으로 공유했습니다. API 라우트와 클라이언트 컴포넌트 사이에 DTO 변환을 최소화해, 리뷰 작성/조회 흐름을 구현하는 동안 타입 불일치로 인한 버그를 거의 겪지 않았습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">모든 상점을 위한 리뷰 허브</h2>
    <p>프랜차이즈부터 동네 가게까지 <strong>모든 상점</strong>에 대해 리뷰를 남길 수 있도록 스키마를 설계했습니다. 카테고리, 위치, 키워드 필터를 통해 리뷰를 탐색할 수 있었고, 운영 기간 동안 2천 개 이상의 상점이 등록되었습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">좋아요는 강조, 싫어요는 블라인드</h2>
    <p>정책 때문에 진심이 가려지는 것이 싫었습니다. 그래서 좋아요를 많이 받은 리뷰는 더 크게 노출했고, 싫어요가 몰린 리뷰는 기본적으로 블라인드 처리되지만, 눈 모양 버튼을 누르면 내용을 확인할 수 있게 했습니다. 누구도 리뷰에 토를 달지 못하게, 진짜 경험담을 그대로 드러내고 싶었습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">잠시 멈춘 이유</h2>
    <p>런칭 후 6개월 동안 운영하며 결제 연동과 신고 프로세스를 준비했지만, 운영 인력 부족으로 현재는 중지된 상태입니다. 재가동 시에는 리뷰 검증 자동화와 상점 데이터 확장을 우선순위로 두고 있습니다.</p>
  </article>
</div>
