---
layout: default
title: QR + Next.js => 프리페이 선불권 MVP
description: QR코드로 선불권을 인증하고 가맹점의 기록을 자동화한 토이 프로젝트 회고입니다.
tags:
  - Next.js
  - QR
  - Prepay
---

<div class="container">
  <header class="section">
    <h1 class="hero__title" style="font-size:2.6rem;">QR + Next.js =&gt; 프리페이 선불권 MVP</h1>
    <p class="section__intro">QR코드로 선불권을 인증하고, 사용 로그를 자동으로 남겨 가맹점이 수기로 기록하지 않아도 되도록 만든 토이 프로젝트입니다. MVP까지 만든 뒤, 토스 선불 결제 정책이 이미 있어서 중단했습니다.</p>
  </header>

  <article class="section">
    <h2 class="section__title">QR로 선불권 인증</h2>
    <p>구매자가 받은 QR코드를 가맹점 POS나 모바일에서 스캔하면 즉시 선불권의 유효 여부와 잔여 횟수를 확인하도록 만들었습니다. 스캔 결과는 Next.js API Route에서 검증하고, 클라이언트는 인증 결과에 따라 사용 가능/차단 상태를 바로 보여줍니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">기록을 자동으로 남기는 흐름</h2>
    <p>스캔이 성공하면 결제 ID, 시각, 가맹점 정보를 함께 저장해 가맹점이 별도로 장부를 적지 않아도 되도록 했습니다. 관리자 화면에서는 최근 사용 로그를 즉시 확인할 수 있어, 환불·분쟁 시에도 언제 사용됐는지 바로 찾을 수 있습니다.</p>
  </article>

  <article class="section">
    <h2 class="section__title">MVP에서 멈춘 이유</h2>
    <p>토스가 이미 선불 결제 정책을 제공하는 것을 확인했고, 결제·정산 규칙을 새로 설계할 필요가 없어 MVP로 마무리했습니다. 대신 운영하며 얻은 인사이트—QR 인증 흐름, 선불권 잔여 횟수 업데이트, 가맹점 알림—은 다른 실험 서비스의 결제 UX를 만들 때 재사용할 계획입니다.</p>
  </article>
</div>
