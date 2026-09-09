import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
const bootstrap = document.getElementById("initial-home");
const initialHome = bootstrap ? JSON.parse(bootstrap.textContent) : undefined;
const app = (
  <React.StrictMode>
    <App initialHome={initialHome} />
  </React.StrictMode>
);

if (root.dataset.prerendered === "true" && initialHome) {
  ReactDOM.hydrateRoot(root, app);
} else {
  ReactDOM.createRoot(root).render(app);
}
