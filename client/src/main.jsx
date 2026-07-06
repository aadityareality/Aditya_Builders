import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.jsx";
import { initGA } from "./utils/analytics.js";
import { initPixel } from "./utils/pixel.js";

// Initialize analytics trackers on load
initGA();
initPixel();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
