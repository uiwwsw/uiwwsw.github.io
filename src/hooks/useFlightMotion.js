import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFlightMotion,
  queueFlightImpulse,
  resetFlightMotion,
  stepFlightMotion,
  stopFlightMotion,
} from "../utils/flightMotion.js";
import { SIGNAL_DISTANCE } from "../utils/secretSignal.js";

export function useFlightMotion({ enabled, reducedMotion, allowSignal }) {
  const motion = useRef(createFlightMotion());
  const wake = useRef(null);
  const [distance, publish] = useState(0);
  const getDistance = useCallback(() => motion.current.distance, []);
  const setDistance = useCallback((next) => {
    const state = motion.current;
    resetFlightMotion(
      state,
      typeof next === "function" ? next(state.distance) : next,
    );
    publish(state.distance);
    wake.current?.();
  }, []);
  const travel = useCallback(
    (delta) => {
      if (!enabled) return;
      // Wheel and touch supply distance directly. The camera eases toward it,
      // while the signal still needs timed pressure and release.
      queueFlightImpulse(motion.current, delta, { reducedMotion: true, allowSignal });
      publish(motion.current.distance);
      wake.current?.();
    },
    [enabled, allowSignal],
  );
  const stop = useCallback(() => stopFlightMotion(motion.current), []);
  useEffect(() => {
    stopFlightMotion(motion.current);
    if (!enabled) return;
    let frame = null;
    let last = 0;
    const state = motion.current;
    const active = () =>
      allowSignal && state.distance >= 1 && state.distance < SIGNAL_DISTANCE &&
      (state.pressure > 0 || state.distance > 1);
    const tick = (now) => {
      frame = null;
      const before = state.distance;
      const next = stepFlightMotion(state, (now - last) / 1000, {
        reducedMotion,
        allowSignal,
      });
      last = now;
      if (next !== before) publish(next);
      if (active()) frame = requestAnimationFrame(tick);
    };
    wake.current = () => {
      if (frame !== null || !active()) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    wake.current();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      wake.current = null;
      stopFlightMotion(state);
    };
  }, [enabled, reducedMotion, allowSignal]);
  return { distance, getDistance, setDistance, travel, stop };
}
