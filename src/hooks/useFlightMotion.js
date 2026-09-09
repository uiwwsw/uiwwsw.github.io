import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFlightMotion,
  queueFlightImpulse,
  resetFlightMotion,
  stepFlightMotion,
  stopFlightMotion,
} from "../utils/flightMotion.js";

export function useFlightMotion({ enabled, reducedMotion, allowSignal }) {
  const motion = useRef(createFlightMotion());
  const [distance, publish] = useState(0);
  const setDistance = useCallback((next) => {
    const state = motion.current;
    resetFlightMotion(
      state,
      typeof next === "function" ? next(state.distance) : next,
    );
    publish(state.distance);
  }, []);
  const travel = useCallback(
    (delta) => {
      if (!enabled) return;
      queueFlightImpulse(motion.current, delta, { reducedMotion, allowSignal });
      publish(motion.current.distance);
    },
    [enabled, reducedMotion, allowSignal],
  );
  useEffect(() => {
    stopFlightMotion(motion.current);
    if (!enabled) return;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const before = motion.current.distance;
      const next = stepFlightMotion(motion.current, (now - last) / 1000, {
        reducedMotion,
        allowSignal,
      });
      last = now;
      if (next !== before) publish(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      stopFlightMotion(motion.current);
    };
  }, [enabled, reducedMotion, allowSignal]);
  return { distance, setDistance, travel };
}
