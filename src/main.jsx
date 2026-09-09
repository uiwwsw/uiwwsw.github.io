import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { beginSkyVisit } from "./utils/visitSky.js";

const root = document.getElementById("root");
const bootstrap = document.getElementById("initial-home");
const initialHome = bootstrap ? JSON.parse(bootstrap.textContent) : undefined;
const visitSeed = beginSkyVisit(window);
const app = (
  <React.StrictMode>
    <App initialHome={initialHome} visitSeed={visitSeed} />
  </React.StrictMode>
);

if (root.dataset.prerendered === "true" && initialHome) {
  ReactDOM.hydrateRoot(root, app);
} else {
  ReactDOM.createRoot(root).render(app);
}
