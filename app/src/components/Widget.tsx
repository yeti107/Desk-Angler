import { useEffect, useState } from "react";
import {
  getSessionInfo,
  onSessionInfo,
  onWidgetInteractive,
  requestTogglePause,
  showMainWindow,
  type SessionInfo,
} from "../widgetBridge";
import Fisherman from "./Fisherman";
import "./Widget.css";

// The page shown inside the small always-on-top window.
function Widget() {
  const [info, setInfo] = useState<SessionInfo>({
    active: false,
    isFishing: true,
    biteCount: 0,
    manuallyPaused: false,
  });
  // False while clicks pass through the widget, which is most of the time.
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    getSessionInfo().then(setInfo);
    return onSessionInfo(setInfo);
  }, []);

  useEffect(() => onWidgetInteractive(setInteractive), []);

  return (
    <div className={interactive ? "widget interactive" : "widget"}>
      <Fisherman isFishing={info.isFishing} biteCount={info.biteCount} />

      {/* Sits over the scene so the whole widget can be dragged. */}
      <div className="widget-drag" data-tauri-drag-region />

      {interactive && (
        <div className="widget-controls">
          <button
            onClick={requestTogglePause}
            title={info.manuallyPaused ? "Resume" : "Pause"}
            aria-label={info.manuallyPaused ? "Resume" : "Pause"}
          >
            {info.manuallyPaused ? "▶" : "❚❚"}
          </button>
          <button
            onClick={showMainWindow}
            title="Open Desk Angler"
            aria-label="Open Desk Angler"
          >
            ⛶
          </button>
        </div>
      )}
    </div>
  );
}

export default Widget;
