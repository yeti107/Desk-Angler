// Watches the webcam with MediaPipe and tells the backend, about once a
// second, whether a person is at the desk.
//
// Frames are analysed in memory on this computer and thrown away. They are
// never saved or sent anywhere; the only thing that leaves this file is a
// yes/no, sent to src-tauri/src/presence.rs. Everything MediaPipe needs (the
// engine and the models) ships inside the app, so this works offline.

import { invoke } from "@tauri-apps/api/core";
import { FaceDetector, PoseLandmarker } from "@mediapipe/tasks-vision";
// Vite copies these into the app and gives us their URLs.
import wasmLoaderPath from "@mediapipe/tasks-vision/vision_wasm_internal.js?url";
import wasmBinaryPath from "@mediapipe/tasks-vision/vision_wasm_internal.wasm?url";

const CHECK_INTERVAL_MS = 1000;

// Served from public/models.
const FACE_MODEL = "/models/blaze_face_short_range.tflite";
const POSE_MODEL = "/models/pose_landmarker_lite.task";

type Detectors = {
  face: FaceDetector;
  pose: PoseLandmarker;
};

// Loading the models takes a moment, so it is done once and reused by every
// session after that.
let detectors: Promise<Detectors> | null = null;

function loadDetectors() {
  if (!detectors) {
    detectors = createDetectors();
    // If loading failed, try again next time instead of keeping the failure.
    detectors.catch(() => {
      detectors = null;
    });
  }
  return detectors;
}

async function createDetectors(): Promise<Detectors> {
  const wasm = { wasmLoaderPath, wasmBinaryPath };

  // One after the other rather than both at once, so the two don't race to
  // set up the shared engine.
  const face = await FaceDetector.createFromOptions(wasm, {
    baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
    runningMode: "IMAGE",
  });
  const pose = await PoseLandmarker.createFromOptions(wasm, {
    baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
    runningMode: "IMAGE",
    numPoses: 1,
  });

  return { face, pose };
}

// The cheap face check runs first. The body (pose) check only runs when no
// face is found, which still spots someone looking down at a book or turned
// towards another screen.
//
// Later checks, such as spotting a phone, can be added alongside these.
function personInFrame(found: Detectors, video: HTMLVideoElement) {
  if (found.face.detect(video).detections.length > 0) {
    return true;
  }
  return found.pose.detect(video).landmarks.length > 0;
}

type Running = {
  stream: MediaStream;
  video: HTMLVideoElement;
  timer: number;
};

let running: Running | null = null;
// Goes up on every start and stop, so a start that is still waiting (on the
// models or the permission prompt) can tell it has been cancelled.
let attempt = 0;

// Opens the camera and starts reporting. Throws a message to show the user
// if there is no camera or permission was refused.
export async function startMediaPipeCamera() {
  if (running) {
    return;
  }
  const thisAttempt = ++attempt;

  let found: Detectors;
  try {
    found = await loadDetectors();
  } catch (error) {
    // Keep the real reason in the console for debugging; the player gets a
    // friendly message.
    console.error("Loading MediaPipe failed:", error);
    throw "The person detector couldn't be loaded.";
  }
  const stream = await openCamera();

  if (thisAttempt !== attempt) {
    // Stopped while we were waiting.
    stopTracks(stream);
    return;
  }

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  // The video has to be on the page for some browsers to keep decoding it,
  // but nobody needs to see it.
  Object.assign(video.style, {
    position: "fixed",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.append(video);
  try {
    await video.play();
  } catch {
    stopTracks(stream);
    video.remove();
    throw "The camera could not be set up.";
  }

  const timer = window.setInterval(() => {
    // Not enough of the video has arrived yet to analyse a frame.
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    let personVisible: boolean;
    try {
      personVisible = personInFrame(found, video);
    } catch {
      // Skip this frame. If it keeps failing, the backend stops hearing from
      // us and treats the camera as stale.
      return;
    }
    invoke("report_presence", { personVisible });
  }, CHECK_INTERVAL_MS);

  running = { stream, video, timer };
}

export function stopMediaPipeCamera() {
  attempt++;
  if (!running) {
    return;
  }

  window.clearInterval(running.timer);
  stopTracks(running.stream);
  running.video.remove();
  running = null;
}

async function openCamera() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      // A small picture is plenty for spotting a person and is cheaper to
      // analyse.
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  } catch (error) {
    throw cameraErrorMessage(error);
  }
}

// Turns the camera off, which also turns off the camera light.
function stopTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function cameraErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";

  switch (name) {
    case "NotAllowedError":
      return navigator.userAgent.includes("Windows")
        ? "Camera access is off. Allow it in Settings > Privacy & security > Camera, including \"Let desktop apps access your camera\"."
        : "Camera access is off. Allow it in System Settings > Privacy & Security > Camera.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found.";
    case "NotReadableError":
      return "The camera couldn't be started. Another app may be using it.";
    default:
      return "The camera could not be set up.";
  }
}
