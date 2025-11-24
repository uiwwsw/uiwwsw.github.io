# UIWWSW Next.js Starter

공용 레이아웃, MDX 기반 블로그, 디자인 시스템 토큰을 포함한 Next.js App Router 스타터입니다. 기본 다크 테마를 제공하며 접근성, 문서화, 배포 흐름을 빠르게 가져갈 수 있도록 구성했습니다.

## 요구 사항
- Node.js 18 이상
- npm 9 이상 (프로젝트에는 `package-lock.json`이 포함되어 있으므로 `npm ci` 사용 권장)

## 설치
1. 의존성 설치:
   ```bash
   npm ci
   ```
2. 환경 변수: 현재 필수 환경 변수는 없습니다. 추후 API를 연결할 경우 `.env.local`에 추가하세요.

## 개발
- 개발 서버 실행:
  ```bash
  npm run dev
  ```
- ESLint 검사:
  ```bash
  npm run lint
  ```

## 빌드 및 배포
- 프로덕션 빌드:
  ```bash
  npm run build
  ```
- 로컬 프로덕션 미리보기:
  ```bash
  npm run start
  ```
- 배포 권장 환경: Vercel. `npm run build` 결과물을 그대로 사용하며, 환경 변수/리다이렉트 설정은 `next.config.js`에서 관리합니다.

## 콘텐츠 작성 가이드
- 위치: `content/posts/*.mdx`
- 프런트매터 필드:
  - `title` (필수)
  - `summary` (선택)
  - `date` (`YYYY-MM-DD` 문자열 권장)
  - `tags` (문자열 배열)
  - `published` (초안 처리 시 `false` 지정)
  - `cover` (옵션, 이미지 경로)
- 작성 팁:
  - h2/h3 헤딩이 자동으로 목차로 추출됩니다. 코드 블록 내부 헤딩은 무시됩니다.
  - 본문은 MDX를 지원하며 `app/mdx-components.tsx`에 정의된 컴포넌트를 그대로 사용할 수 있습니다.
  - 읽기 시간은 1분당 180단어 기준으로 자동 계산되어 목록/상세 페이지에 노출됩니다.
- OSS 리스트는 `content/oss-packages.ts`에서 수정할 수 있습니다.

## 문서화/참고 자료
- 디자인/IA/SEO 가이드: `docs/` 디렉터리 참고 (`design-system.md`, `information-architecture.md`, `performance-seo.md`).
- QA/핸드오프 기록은 `docs/qa-handoff.md`에서 확인할 수 있습니다.
