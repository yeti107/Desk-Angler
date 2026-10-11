// The main window and the widget are two separate pages that share no
// variables. Everything they say to each other goes through this file.

import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { subscribe } from "./events";

// Mirrors the SessionInfo struct in src-tauri/src/widget.rs. Keep them in sync.
export type SessionInfo = {
  active: boolean;
  isFishing: boolean;
  biteCount: number;
  manuallyPaused: boolean;
};

// Main window -> widget: what the session looks like right now.
export function publishSessionInfo(info: SessionInfo) {
  return invoke<void>("update_session", { info });
}

export function getSessionInfo() {
  return invoke<SessionInfo>("session_info");
}

export function onSessionInfo(handler: (info: SessionInfo) => void) {
  return subscribe<SessionInfo>("session-info", handler);
}

// Rust -> widget: whether the widget currently accepts clicks.
export function onWidgetInteractive(handler: (interactive: boolean) => void) {
  return subscribe<boolean>("widget-interactive", handler);
}

// Widget -> main window: the pause button was pressed.
export function requestTogglePause() {
  return emit("toggle-pause");
}

export function onTogglePauseRequest(handler: () => void) {
  return subscribe<null>("toggle-pause", handler);
}

export function showMainWindow() {
  return invoke<void>("show_main_window");
}
