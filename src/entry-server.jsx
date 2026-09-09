import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";

// Render the actual landing interface, not a differently styled placeholder.
// App defers browser state and WebGL until after hydration.
export const renderHome = (initialHome, visitSeed = 0) =>
  renderToString(
    <React.StrictMode>
      <App initialHome={initialHome} visitSeed={visitSeed} />
    </React.StrictMode>,
  );
