export const SCENE_TEXTURES = {
  day: "/textures/earth-day.jpg",
  moon: "/textures/moon.jpg",
  night: "/textures/earth-night.jpg",
  clouds: "/textures/earth-surface.jpg",
};

// Keep shader compilation off the first visible frame. The renderer is not
// asked to draw pending programs; two successful complete frames precede reveal.
export function createSceneStartup({ warm, render, onReady, onError }) {
  let phase = "waiting";
  let frames = 0;
  const fail = () => {
    if (phase === "disposed" || phase === "failed") return;
    phase = "failed";
    onError();
  };
  return {
    frame(assetsReady) {
      if (!assetsReady || phase === "disposed" || phase === "failed") return;
      if (phase === "waiting") {
        phase = "warming";
        try {
          Promise.resolve(warm()).then(() => {
            if (phase === "warming") phase = "drawing";
          }, fail);
        } catch {
          fail();
        }
        return;
      }
      if (phase === "warming") return;
      try {
        render();
        if (phase === "drawing" && ++frames === 2) {
          phase = "live";
          onReady();
        }
      } catch {
        fail();
      }
    },
    dispose() {
      phase = "disposed";
    },
  };
}
