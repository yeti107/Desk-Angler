import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import Widget from "./components/Widget";

// Both windows load this same file. The window's label, set in
// tauri.conf.json, says which one we are in.
const isWidget = getCurrentWindow().label === "widget";

if (isWidget) {
  document.documentElement.classList.add("widget-window");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isWidget ? <Widget /> : <App />}</React.StrictMode>,
);
