import { useEffect, useState } from "react";
import Fisherman from "./components/Fisherman";
import type { Fish } from "./game/fish";
import { rollCatchGap, rollFish } from "./game/fishing";

type SessionState = "idle" | "running" | "ended";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function App() {
  const [session, setSession] = useState<SessionState>("idle");
  const [isFishing, setIsFishing] = useState(true);
  const [focusedSeconds, setFocusedSeconds] = useState(0);
  const [catches, setCatches] = useState<Fish[]>([]);
  // The focused-time mark, in seconds, at which the next fish is caught.
  const [nextCatchAt, setNextCatchAt] = useState(0);

  useEffect(() => {
    if (session !== "running" || !isFishing) {
      return;
    }

    const timer = setInterval(() => {
      setFocusedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [session, isFishing]);

  useEffect(() => {
    if (session !== "running" || focusedSeconds < nextCatchAt) {
      return;
    }

    const fish = rollFish();
    setCatches((previous) => [...previous, fish]);
    setNextCatchAt(focusedSeconds + rollCatchGap());
  }, [session, focusedSeconds, nextCatchAt]);

  function startSession() {
    setFocusedSeconds(0);
    setCatches([]);
    setNextCatchAt(rollCatchGap());
    setIsFishing(true);
    setSession("running");
  }

  return (
    <div>
      <h1>Desk Angler</h1>

      {session === "idle" && (
        <button onClick={startSession}>Start Session</button>
      )}

      {session === "running" && (
        <div>
          <Fisherman isFishing={isFishing} biteCount={catches.length} />
          <div>{isFishing ? "Fishing" : "Paused"}</div>
          <div>Focused time: {formatTime(focusedSeconds)}</div>
          <div>Fish in the bucket: {catches.length}</div>

          {/* Stand-in for focus detection until the camera and app signals exist */}
          <button onClick={() => setIsFishing(!isFishing)}>
            {isFishing ? "Simulate distraction" : "Simulate back to work"}
          </button>

          <button onClick={() => setSession("ended")}>End Session</button>
        </div>
      )}

      {session === "ended" && (
        <div>
          <div>Session over. You focused for {formatTime(focusedSeconds)}.</div>

          {catches.length === 0 ? (
            <div>Nothing bit this time.</div>
          ) : (
            <ul>
              {catches.map((fish, index) => (
                <li key={index}>
                  {fish.name} ({fish.rarity})
                </li>
              ))}
            </ul>
          )}

          <button onClick={startSession}>New Session</button>
        </div>
      )}
    </div>
  );
}

export default App;
