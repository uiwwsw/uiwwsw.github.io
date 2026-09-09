export const FLIGHT_GUIDANCE = {
  touch: {
    title: "두 손가락을 벌려 다가가 보세요",
    detail: "드래그로 둘러보기 · 별을 눌러 글 읽기",
  },
  mouse: {
    title: "스크롤을 내려, 별 사이로",
    detail: "드래그로 둘러보기 · ↑↓ 이동 · 별 클릭",
  },
};

// This is control guidance only: never show it over reading, a failed scene,
// a hidden tab, or the Earth-only discovery mode. It never changes travel.
export const shouldShowFlightGuide = ({
  requested,
  ready,
  assembled,
  sceneError,
  panel,
  pageHidden,
  focusingEarth,
}) =>
  Boolean(
    requested &&
    ready &&
    assembled &&
    !sceneError &&
    !panel &&
    !pageHidden &&
    !focusingEarth,
  );
