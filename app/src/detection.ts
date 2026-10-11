import { invoke } from "@tauri-apps/api/core";
import { subscribe } from "./events";
import { loadJson, saveJson } from "./storage";

// These two types mirror the structs in src-tauri/src. Keep them in sync.
export type AppInfo = {
  id: string;
  name: string;
};

export type Tick = {
  frontmostApp: AppInfo | null;
  // null while the camera is off.
  personVisible: boolean | null;
};

export function getRunningApps() {
  return invoke<AppInfo[]>("running_apps");
}

// Turns the camera on. Fails with a message to show the user if there is no
// camera or permission was refused.
export function startCamera() {
  return invoke<void>("start_camera");
}

export function stopCamera() {
  return invoke<void>("stop_camera");
}

// Calls the handler once a second, driven by the Rust side. Returns a function
// that stops listening.
export function onTick(handler: (tick: Tick) => void) {
  return subscribe<Tick>("tick", handler);
}

const DISTRACTIONS_KEY = "distraction-apps";

export function loadDistractions() {
  return loadJson<AppInfo[]>(DISTRACTIONS_KEY, []);
}

export function saveDistractions(distractions: AppInfo[]) {
  saveJson(DISTRACTIONS_KEY, distractions);
}
