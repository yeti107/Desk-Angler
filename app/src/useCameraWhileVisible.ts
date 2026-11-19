import { useEffect } from "react";
import { startMediaPipeCamera, stopMediaPipeCamera } from "./camera";

// Runs the camera in this window while a session is active and the window is
// visible on screen. macOS stops updating the camera picture in a window that
// is minimised or covered, so the main window and the widget each use this
// hook, and whichever one is visible takes over the camera.
export function useCameraWhileVisible(active: boolean) {
  useEffect(() => {
    // No session, so this window doesn't need the camera.
    if (!active) {
      return;
    }

    // Start or stop the camera to match whether this window is visible.
    // Calling either one twice in a row is safe.
    function updateCamera() {
      if (document.visibilityState === "visible") {
        startMediaPipeCamera().catch((error) =>
          console.error("Starting the camera failed:", error),
        );
      } else {
        stopMediaPipeCamera();
      }
    }

    // The window may already be visible, so check once now...
    updateCamera();
    // ...and again every time it is shown or hidden.
    document.addEventListener("visibilitychange", updateCamera);

    // When the session ends: stop listening and turn the camera off.
    return () => {
      document.removeEventListener("visibilitychange", updateCamera);
      stopMediaPipeCamera();
    };
  }, [active]);
}
