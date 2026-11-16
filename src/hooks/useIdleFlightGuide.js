import { useCallback, useEffect, useRef, useState } from "react";
import { createIdleGuide } from "../utils/flightGuide.js";

export function useIdleFlightGuide(enabled, automatic) {
  const [requested, publish] = useState(false);
  const controller = useRef();
  useEffect(() => {
    const idle = createIdleGuide({
      onChange: publish,
      schedule: (callback, delay) => window.setTimeout(callback, delay),
      cancel: (timer) => window.clearTimeout(timer),
    });
    controller.current = idle;
    return () => idle.dispose();
  }, []);
  useEffect(() => controller.current.enable(enabled, automatic), [enabled, automatic]);
  const setRequested = useCallback(
    (value) => controller.current?.request(value),
    [],
  );
  return { requested, setRequested };
}
