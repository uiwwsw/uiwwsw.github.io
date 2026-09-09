import React from "react";
import { seededRandom } from "../utils/observatory.js";

// Inline, deterministic and decorative: present in the first HTML, with no
// image download, canvas, browser APIs or dependency on the article catalog.
const random = seededRandom(9022026);
const stars = Array.from({ length: 96 }, () => ({
  x: +(random() * 160).toFixed(2),
  y: +(random() * 100).toFixed(2),
  radius: +(0.045 + random() * 0.105).toFixed(3),
  opacity: +(0.22 + random() * 0.36).toFixed(2),
}));

export default function OpeningSky() {
  return (
    <div className="opening-sky" aria-hidden="true">
      <svg
        viewBox="0 0 160 100"
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
          />
        ))}
      </svg>
    </div>
  );
}
