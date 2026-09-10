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

export const READING_GUIDANCE = {
  touch: {
    title: "별이나 제목을 눌러 글을 읽어보세요",
    detail: "드래그로 둘러보기 · 아래 슬라이더로 이동",
  },
  mouse: {
    title: "별이나 제목을 눌러 글을 읽어보세요",
    detail: "드래그로 둘러보기 · 아래 슬라이더로 이동",
  },
};

export const GUIDE_FIRST_IDLE_MS = 4000;
export const GUIDE_RETURN_IDLE_MS = 14000;

// One cancellable timeout, only while the scene is eligible. A quiet visitor
// sees help; any deliberate input dismisses it and starts a new idle window.
// Hidden tabs, reading, cruising and discovery never bank an overdue prompt.
export function createIdleGuide({ onChange, schedule, cancel }) {
  let enabled = false;
  let interacted = false;
  let visible = false;
  let explicit = false;
  let disposed = false;
  let timer;
  let generation = 0;
  const publish = (next) => {
    if (visible === next) return;
    visible = next;
    onChange(next);
  };
  const clear = () => {
    generation++;
    if (timer !== undefined) cancel(timer);
    timer = undefined;
  };
  const arm = () => {
    clear();
    if (!enabled || disposed) return;
    const revision = generation;
    timer = schedule(
      () => {
        if (disposed || !enabled || generation !== revision) return;
        timer = undefined;
        publish(true);
      },
      interacted ? GUIDE_RETURN_IDLE_MS : GUIDE_FIRST_IDLE_MS,
    );
  };
  return {
    enable(next) {
      if (disposed || enabled === next) return;
      enabled = next;
      if (!enabled) explicit = false;
      publish(enabled && explicit);
      if (enabled && explicit) clear();
      else arm();
    },
    request(next) {
      if (disposed) return;
      interacted = true;
      explicit = next;
      if (next) {
        clear();
        publish(enabled);
      } else {
        publish(false);
        arm();
      }
    },
    dispose() {
      disposed = true;
      clear();
    },
  };
}

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
