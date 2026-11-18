import { invoke } from "@tauri-apps/api/core";
import { startMediaPipeCamera, stopMediaPipeCamera } from "./camera";
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

// Which engine analyses the camera. Normally MediaPipe, here in the frontend;
// a Mac build with the `apple-vision` feature uses Apple Vision in Rust.
let usesMediaPipe: Promise<boolean> | null = null;

function cameraUsesMediaPipe() {
  usesMediaPipe ??= invoke<string>("camera_engine").then(
    (engine) => engine === "mediapipe",
  );
  return usesMediaPipe;
}

// Turns the camera on. Fails with a message to show the user if there is no
// camera or permission was refused.
export async function startCamera() {
  if (await cameraUsesMediaPipe()) {
    await startMediaPipeCamera();
  }
  await invoke<void>("start_camera");
}

export async function stopCamera() {
  if (await cameraUsesMediaPipe()) {
    stopMediaPipeCamera();
  }
  await invoke<void>("stop_camera");
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
