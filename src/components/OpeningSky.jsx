import React from "react";
import { createSkyPreview } from "../utils/skyBackdrop.js";

// Inline, deterministic and decorative: present in the first HTML, with no
// image download, canvas, browser APIs or dependency on the article catalog.
const previews = [createSkyPreview(false), createSkyPreview(true)];

export default function OpeningSky() {
  return (
    <div className="opening-sky" aria-hidden="true">
      {previews.map((stars, index) => (
        <svg
          key={index}
          className={index ? "opening-stars-touch" : "opening-stars-wide"}
          viewBox="-3 -1 6 2"
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
        >
          {stars.map((star, i) => (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.radius}
              opacity={star.opacity}
              fill={star.color}
            />
          ))}
        </svg>
      ))}
    </div>
  );
}
