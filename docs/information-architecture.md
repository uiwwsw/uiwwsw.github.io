# Information Architecture & Sitemap (TASK-02)

## 1) IA 목표 및 톤
- 목적: 개인 포트폴리오/블로그를 한국어 중심으로 구성하되, 핵심 내비게이션과 주요 CTA는 필요 시 영어 병기.
- 톤: 간결·신뢰·개방. 기술 블로그와 오픈 소스 활동을 강조하며, 포트폴리오(Projects/Open Source)와 경력 소개(About)를 홈 히어로에서 바로 접근.

## 2) 언어 전략
- 기본 언어: 한국어(`lang="ko"`).
- 보조: 주요 내비게이션, CTA, 오픈 소스 레포명 등은 한국어+영어 병기 가능. 블로그 포스트는 한국어 우선, 필요 시 영어 번역 포스트를 `/blog/en/...` 하위로 병렬 제공.
- 메타데이터: 제목/설명은 한국어 기본값을 사용하고, 영어 요약은 OG/Twitter 카드에 보조로 포함.

## 3) 최종 사이트맵 & 라우트 설계 (Next.js App Router)
- 라우트 그룹: 마케팅/콘텐츠 뷰는 `app/(site)/...`에 배치하여 공용 레이아웃과 UI를 공유.
- 동적 콘텐츠: 프로젝트, 블로그 포스트, 오픈 소스 항목은 각각의 동적 세그먼트로 구성.

| 영역 | 경로 | 목적 | 주요 섹션/모듈 | CTA | 비고 |
| --- | --- | --- | --- | --- | --- |
| Home | `/` (alias: `/home`) | 브랜드 소개, 주요 작업 하이라이트 | Hero(소개, CTA 2개), Featured Projects(3), Featured Blog Posts(3), Open Source highlight, Contact banner | "프로젝트 보기", "블로그 읽기", "협업 문의" | Hero에서 언어 토글 제공(필요 시)
| About | `/about` | 경력, 역량, 가치관 | Timeline/이력, Skill matrix, Speaking/Media, 현재 상태(Available/Contact) | "이력서 보기", "협업 문의" | PDF CV 링크 포함
| Projects | `/projects` | 포트폴리오 리스트 | 필터/태그, 카드 리스트, Pagination | "프로젝트 상세"(각 카드), "상담 요청" | 상세: `/projects/[slug]`
| Project Detail | `/projects/[slug]` | 개별 프로젝트 스토리 | Overview, Role/Stack, Problems & Solutions, Outcomes, Gallery, Links | "데모 보기", "레포 보기", "문의" | OG 이미지/구조화 데이터
| Blog | `/blog` | 글 모음 | 카테고리/태그, 최신/인기, 검색(optional) | "포스트 읽기", "구독" | 상세: `/blog/[slug]`; 영어판 `/blog/en/[slug]`
| Blog Post | `/blog/[slug]` | 글 상세 | Hero(title/meta), TOC, 본문, 공유, 관련 글, Comments(opt) | "관련 글", "오픈 소스 보기" | MDX 기반
| Open Source | `/open-source` | 기여·프로젝트 소개 | Maintained Projects, Contributions, How to contribute | "GitHub 보기", "Issue 열기" | 상세: `/open-source/[slug]`
| Contact | `/contact` | 연락 채널 | Contact form, 이메일/DM, FAQ, Response time | "메일 보내기", "캘린더 예약"(optional) | 폼 전송 감사 페이지 `/contact/thanks`
| Uses/Stack | `/uses` | 개발 환경 소개 | Hardware/Software, Productivity stack | "GitHub Follow" | Optional 메뉴(푸터)
| Archive | `/archive` | 모든 게시물/노트 | 연도별/태그별 목록 | "포스트 읽기" | 블로그 내비 확장
| Legal | `/privacy`, `/terms` | 정책 | Privacy, Terms | - | 푸터에만 노출

### Next.js 디렉터리 제안 (`app/`)
```
app/
  (site)/
    layout.tsx            // 사이트 공용 레이아웃/헤더/푸터, 기본 lang=ko
    page.tsx              // Home
    about/page.tsx
    projects/page.tsx
    projects/[slug]/page.tsx
    blog/page.tsx
    blog/[slug]/page.tsx
    blog/en/[slug]/page.tsx   // 선택적 영어판
    open-source/page.tsx
    open-source/[slug]/page.tsx
    contact/page.tsx
    contact/thanks/page.tsx
    uses/page.tsx
    archive/page.tsx
    privacy/page.tsx
    terms/page.tsx
```
- 콘텐츠 소스: `content/projects/*.mdx`, `content/blog/*.mdx`, `content/open-source/*.mdx` 등으로 분리. 태그/메타데이터는 MDX frontmatter로 관리.
- 컴포넌트 레이어: `app/(site)/components`에 Hero/CTA/Lists, `app/(site)/[section]/_components`로 섹션별 특화 컴포넌트 유지.

## 4) 페이지별 필수 섹션/CTA
- Home: Hero(소개+CTA 2), Featured Projects, Featured Blog, Open Source highlight, Contact banner.
- About: Hero(요약+CTA: 이력서, 연락), Timeline, Skill matrix, Values, Speaking/Press.
- Projects: Filterable list, Tag/Stack chips, CTA: 프로젝트 상세/문의.
- Project Detail: Overview, Role/Stack, Problems & Solutions, Outcomes/metrics, Gallery, Links(Repo/Live), CTA: Demo/Repo/Contact.
- Blog: Category/Tag filters, Post list with excerpt, CTA: "구독" 또는 "RSS".
- Blog Post: Hero(meta), TOC, MDX 본문, Related posts, CTA: Open Source/Project 링크, Comments(optional).
- Open Source: Maintained projects, Contribution highlights, How to contribute, CTA: GitHub/Issue/Star.
- Contact: Hero, Form, Direct links(Email/DM), FAQ, CTA: Send email/Book meeting, Thank-you page.
- Uses: Hardware/Software/Services 리스트, CTA: GitHub follow/Newsletter.
- Footer(공통): Social links, Newsletter opt-in, Sitemap(주요 페이지 + Legal), Language toggle if 제공.

## 5) 내비게이션 & 푸터 링크 맵
- 헤더(모바일: 햄버거/Sheet): Home, About, Projects, Blog, Open Source, Contact. 필요 시 언어 토글(KR/EN) 우측 배치.
- 푸터: Sitemap(About, Projects, Blog, Open Source, Contact, Uses, Archive), Social(GitHub, LinkedIn, Twitter), Newsletter, Legal(Privacy, Terms).

## 6) 접근성/국제화 고려
- `html lang="ko"` 기본 설정, 언어 토글 클릭 시 URL prefix(`/en/...`)로 전환.
- 내비게이션 링크는 Skip-to-content 포함, 헤더/푸터는 키보드 포커스 가능하게 유지.
- CTA 텍스트는 동사형으로 명확히 표현하고, 버튼 대비 4.5:1 이상 유지.

## 7) 향후 TODO (구현 가이드)
- MDX 콘텐츠 로더를 프로젝트/오픈소스/블로그로 확장하고, 동적 메타데이터 생성.
- `app/(site)/layout.tsx`에 공용 헤더/푸터 + Lang toggle 추가, `metadata` 한국어 기본값 반영.
- Contact 폼 처리(서드파티 또는 서버 액션) 및 스팸 방지 적용.
