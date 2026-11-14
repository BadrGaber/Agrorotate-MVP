import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installSoundEffects } from "./ui/sound";
import { registerOfflineSupport } from "./offline/register";
import { loadSurrogateWeights } from "./engine/fitModel";
import "./styles/global.css";
import "./styles/app.css";

installSoundEffects();

// Register after the first paint. The worker precaches the whole shell, while
// this call downloads the trained model in parallel so the AI is ready even if
// the visitor opens the rotation board before the worker finishes installing.
registerOfflineSupport();
void loadSurrogateWeights();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root container #root not found in index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
