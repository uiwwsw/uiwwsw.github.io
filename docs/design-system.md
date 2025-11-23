# Visual Language & Design System (TASK-03)

기본 목적: 한국어 중심의 포트폴리오/블로그 경험에 맞춘 UI 토큰, 타이포그래피, 간격, 컴포넌트 원칙을 정의한다. Tailwind 테마 확장과 글로벌 스타일에서 바로 사용 가능한 값을 명시한다.

## 1) 팔레트
- 라이트/다크 토글을 `:root`/`.dark` 데이터 테마 변수로 지원한다. Tailwind 색상 키(`background`, `surface`, `muted`, `border`, `ring`, `primary`, `accent`, `success`, `warning`, `danger`, `content.*`)는 모두 CSS 변수에 매핑된다.
- 대비 목표: 주요 CTA 배경 대비 4.5:1 이상, 텍스트 대비 7:1 근접 유지.

| Token | Light | Dark | 용도 |
| --- | --- | --- | --- |
| `background` | `#f8fafc` | `#0b1120` | 페이지 바탕 |
| `surface` | `#ffffff` | `#0f172a` | 카드/모듈 배경 |
| `muted` | `#f1f5f9` | `#111827` | 구분 영역, 코드 배경 |
| `border` | `#e2e8f0` | `#1f2937` | 구분선, input border |
| `ring` | `rgba(37,99,235,0.2)` | `rgba(14,165,233,0.25)` | 포커스 아웃라인 |
| `primary` | `#2563eb` | `#60a5fa` | 메인 CTA, 링크 |
| `primary.foreground` | `#eef2ff` | `#0b1224` | 프라이머리 배경 위 텍스트 |
| `primary.subtle` | `#e0e7ff` | `#1d2a4a` | 배경 하이라이트 |
| `accent` | `#0ea5e9` | `#22d3ee` | 보조 CTA, 상태 배지 |
| `accent.foreground` | `#ecfeff` | `#0b1224` | 액센트 배경 위 텍스트 |
| `accent.subtle` | `#cffafe` | `#10263f` | 소프트 하이라이트 |
| `success` | `#16a34a` | `#34d399` | 성공/완료 |
| `warning` | `#f59e0b` | `#fbbf24` | 경고/주의 |
| `danger` | `#ef4444` | `#f87171` | 오류/위험 |
| `content` | `#0f172a` | `#e2e8f0` | 기본 텍스트 |
| `content.secondary` | `#1e293b` | `#cbd5e1` | 헤더/서브헤더 |
| `content.tertiary` | `#475569` | `#94a3b8` | 본문 보조 |
| `content.inverted` | `#f8fafc` | `#0b1120` | 어두운 배경 위 텍스트 |

## 2) 타이포그래피
- 폰트: `Pretendard Variable`(우선), `Inter` 백업. CDNs: Pretendard(OrionCactus), Google Fonts(Inter/JetBrains Mono).
- 모노폰트: `JetBrains Mono` for code/UI density.
- 정렬/리드: 디스플레이 헤드는 -0.03~-0.04em letter-spacing, 본문은 1.6 line-height.

| Token | Size | Line-height | Weight | 사용 |
| --- | --- | --- | --- | --- |
| `display-2xl` | 3.5rem | 1.05 | 800 | 랜딩 히어로 타이틀 |
| `display-xl` | 3rem | 1.1 | 800 | 섹션 리드 |
| `display-lg` | 2.5rem | 1.15 | 800 | 키 메시지 |
| `title-2xl` | 2.25rem | 1.2 | 700 | 페이지 헤더 |
| `title-xl` | 2rem | 1.25 | 700 | 섹션 헤더 |
| `title-lg` | 1.75rem | 1.3 | 700 | 카드 타이틀(큰) |
| `title-md` | 1.5rem | 1.35 | 700 | 카드 타이틀(중) |
| `title-sm` | 1.25rem | 1.4 | 600 | 라벨 헤더 |
| `body` | 1rem | 1.6 | 500 | 일반 본문 |
| `body-sm` | 0.9375rem | 1.6 | 500 | UI 카피 |
| `caption` | 0.875rem | 1.5 | 500 | 캡션/메타 |
| `micro` | 0.75rem | 1.4 | 500 | 배지/도움말 |

## 3) Spacing Grid
- 4pt 기반, Tailwind spacing 확장 키: `3xs(4)`, `2xs(8)`, `xs(12)`, `sm(16)`, `md(24)`, `lg(32)`, `xl(48)`, `2xl(64)`, `3xl(80)` px.
- 레이아웃 제안: 섹션 상/하는 최소 `xl`, 카드 내부 패딩 `md`, 버튼 수평 패딩 `sm` 이상.

## 4) Radius & Shadow
- Radius: `xs(4)`, `sm(8)`, `md(12)`, `lg(16)`, `xl(20)`, `pill(999px)`.
- Shadow: `xs`(1/2px blur for subtle elevation), `sm`(list/inputs), `md`(카드), `lg`(모달), `focus`(Ring + 3px outline, 색상 토큰 활용).

## 5) Icon 스타일
- Stroke 1.75px 기준, 라운드 조인트(`stroke-linecap: round; stroke-linejoin: round`).
- 사이즈: 16/20/24px 단위; 텍스트 아이콘 페어링 시 20px 사용.
- 색상: 텍스트 톤을 상속, 강조 상태는 `primary`/`accent` 색상 사용.

## 6) 버튼/칩/카드 기본 규칙
- **버튼**
  - 높이: 44px(모바일), 48px(데스크탑). 수평 패딩: `sm`~`md`.
  - 기본 배경: `primary`; Hover 시 6~8% 밝기 상승. 포커스: `ring` 토큰.
  - 구분: `primary`(solid), `ghost`(transparent + `muted` hover), `outline`(border), `subtle`(`primary.subtle` 배경).
- **칩**
  - 높이: 32px, 패딩 `2xs` 수평. Radius: `pill`.
  - 상태: 기본(`muted` 배경), 선택(`primary.subtle` + `primary` 텍스트), 비활성(`content.tertiary`).
- **카드**
  - 배경: `surface`; 패딩 기본 `md`.
  - 라인형 리스트: `border` 1px, Radius `lg`, Shadow `sm`~`md` 필요 시.
  - 헤더/푸터 간격은 `sm`, 본문 텍스트는 `body`/`body-sm` 적용.

## 7) 글로벌 스타일 적용법
- `app/globals.css`에서 폰트 import 및 CSS 변수 선언. `:root[data-theme="dark"]` 또는 `.dark` 클래스 토글로 테마 전환.
- Tailwind 사용 예시:
  ```tsx
  <button className="text-content-inverted bg-primary hover:bg-accent rounded-md px-sm py-2 shadow-sm focus-visible:shadow-focus">
    프로젝트 보기
  </button>
  ```
- 코드/blockquote 등 MDX 요소는 기본 Prose 스타일을 덮어쓰며, 포커스 가능한 요소는 `ring` 토큰을 따른다.

## 8) 상태/피드백 패턴
- 성공: `success` 배경 또는 테두리에 `success.subtle` + 텍스트 `content.secondary`.
- 경고: `warning` 아이콘 + `warning.subtle` 배경, 텍스트 `content.secondary`.
- 오류: `danger` 배경/테두리, 액션은 `primary`/`accent` 대비 유지.

## 9) 접근성 체크리스트
- 포커스 가능한 컴포넌트는 모두 `ring` 섀도우 적용.
- 명도 대비: 본문 텍스트 최소 4.5:1, 헤딩/CTA 7:1을 목표로 팔레트 선택.
- 터치 타겟: 최소 44px 높이 규칙을 버튼/칩 등에 공통 적용.
