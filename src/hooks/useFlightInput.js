import { useEffect } from "react";
import { bindFlightSurface } from "../utils/flightSurface.js";

export function useFlightInput({
  surfaceRef,
  inputRef,
  enabled,
  onTravel,
  onManualInput,
  onLook,
}) {
  useEffect(() => {
    if (!enabled) return;
    return bindFlightSurface({
      surface: surfaceRef.current,
      input: inputRef.current,
      onTravel,
      onManualInput,
      onLook,
    });
  }, [surfaceRef, inputRef, enabled, onTravel, onManualInput, onLook]);
}
