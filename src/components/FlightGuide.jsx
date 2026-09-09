import React from "react";
import { FLIGHT_GUIDANCE } from "../utils/flightGuide.js";
import "./FlightGuide.css";

export default function FlightGuide({ visible, touch, quiet }) {
  const copy = FLIGHT_GUIDANCE[touch ? "touch" : "mouse"];
  return (
    <aside
      id="flight-guide"
      className="flight-guide"
      data-visible={visible}
      data-quiet={quiet}
      role="note"
      aria-label="우주 조작 안내"
      aria-hidden={!visible}
      inert={!visible ? "" : undefined}
    >
      <svg
        className="flight-guide-gesture"
        viewBox="0 0 56 40"
        width="48"
        height="36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {touch ? (
          <>
            <path className="guide-trace" d="m18 28 20-16" />
            <g className="guide-finger guide-finger-left">
              <circle cx="20" cy="26" r="6" />
              <circle cx="20" cy="26" r="2" fill="currentColor" />
              <path d="m13 28-5 5m0-5v5h5" />
            </g>
            <g className="guide-finger guide-finger-right">
              <circle cx="36" cy="14" r="6" />
              <circle cx="36" cy="14" r="2" fill="currentColor" />
              <path d="m43 12 5-5m-5 0h5v5" />
            </g>
          </>
        ) : (
          <>
            <rect x="18" y="3" width="20" height="29" rx="10" />
            <path className="guide-wheel" d="M28 9v5" />
            <path className="guide-trace" d="m24 35 4 3 4-3" />
          </>
        )}
      </svg>
      <div id="flight-guide-copy" className="flight-guide-copy">
        <p>{copy.title}</p>
        <span>{copy.detail}</span>
      </div>
    </aside>
  );
}
