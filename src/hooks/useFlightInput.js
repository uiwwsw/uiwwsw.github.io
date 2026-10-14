import { useEffect, useRef } from "react";
import { bindFlightSurface } from "../utils/flightSurface.js";

export function useFlightInput({
  surfaceRef,
  inputRef,
  enabled,
  onTravel,
  onManualInput,
  onLook,
}) {
  // Progress changes on each gesture frame. Keep capture and pinch baselines
  // alive while forwarding to the latest timeline callbacks.
  const callbacks = useRef();
  callbacks.current = { onTravel, onManualInput, onLook };
  useEffect(() => {
    if (!enabled) return;
    return bindFlightSurface({
      surface: surfaceRef.current,
      input: inputRef.current,
      onTravel: (...args) => callbacks.current.onTravel(...args),
      onManualInput: (...args) => callbacks.current.onManualInput(...args),
      onLook: (...args) => callbacks.current.onLook(...args),
    });
  }, [surfaceRef, inputRef, enabled]);
}
