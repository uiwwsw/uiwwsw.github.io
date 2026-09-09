import React from "react";
import { renderToString } from "react-dom/server";
import App from "./App.jsx";

// Render the actual landing interface, not a differently styled placeholder.
// App defers browser state and WebGL until after hydration.
export const renderHome = (initialHome) =>
  renderToString(
    <React.StrictMode>
      <App initialHome={initialHome} />
    </React.StrictMode>,
  );
