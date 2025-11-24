# Performance & SEO Checklist (TASK-16)

## Lighthouse 목표/측정 기록 포맷
- **대상 URL**: 예) `/`, `/blog`, `/blog/[slug]`
- **환경/모드**: Chrome DevTools Lighthouse (Mobile/Desktop), Throttling 옵션 명시
- **목표 점수**: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- **측정 일시**: YYYY-MM-DD HH:MM (KST)
- **결과**: `Perf / A11y / BP / SEO = 94 / 100 / 100 / 100`
- **후속 액션**: CLS, TBT, LCP, 메타 태그/링크, 이미지/폰트 최적화 등 개선 항목 bullet로 기록

## 구현 체크리스트
- [x] `next/font` 기반 웹폰트 로딩 (`Inter`, `Noto Sans KR`, `JetBrains Mono`)으로 CLS/FOIT 최소화
- [x] `next/image` + WebP/AVIF 설정으로 히어로 그래픽 최적화 및 적절한 `sizes` 제공
- [x] 코드 스플리팅: 헤더/푸터를 `next/dynamic`으로 분리해 초기 JS 번들을 세분화
- [x] `metadataBase`, Open Graph/Twitter 이미지 기본값, canonical/keywords 반영
- [x] `robots.txt`, `sitemap.xml` 자동 생성 라우트 추가 (정적/블로그 URL 포함)
- [ ] 나머지 템플릿(프로젝트 상세/추가 페이지) 메타데이터 보강
- [ ] PWA/웹폰트 서브셋 추가 및 이미지 CDN 검토 (필요 시)
