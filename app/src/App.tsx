import { useEffect, useState } from "react";
import Collection from "./components/Collection";
import DistractionSettings from "./components/DistractionSettings";
import Fisherman from "./components/Fisherman";
import {
  loadDistractions,
  onTick,
  saveDistractions,
  startCamera,
  stopCamera,
  type AppInfo,
} from "./detection";
import { getFish } from "./game/fish";
import { rollCatchGap, rollFish } from "./game/fishing";
import {
  createCatch,
  loadInventory,
  saveInventory,
  type CaughtFish,
} from "./game/inventory";
import { INITIAL_PRESENCE, updatePresence } from "./presence";
import { onTogglePauseRequest, publishSessionInfo } from "./widgetBridge";

type SessionState = "idle" | "running" | "ended";
// Which screen to show while no session is running.
type Page = "home" | "collection";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function App() {
  const [session, setSession] = useState<SessionState>("idle");
  const [page, setPage] = useState<Page>("home");
  const [sessionId, setSessionId] = useState("");
  const [focusedSeconds, setFocusedSeconds] = useState(0);
  // The focused-time mark, in seconds, at which the next fish is caught.
  const [nextCatchAt, setNextCatchAt] = useState(0);
  const [inventory, setInventory] = useState<CaughtFish[]>(loadInventory);
  const [distractions, setDistractions] = useState<AppInfo[]>(loadDistractions);
  const [frontmostApp, setFrontmostApp] = useState<AppInfo | null>(null);
  const [presence, setPresence] = useState(INITIAL_PRESENCE);
  const [cameraError, setCameraError] = useState("");
  const [manuallyPaused, setManuallyPaused] = useState(false);

  const sessionCatches = inventory.filter(
    (caught) => caught.sessionId === sessionId,
  );

  // The distraction app currently in front, if there is one.
  const activeDistraction = distractions.find(
    (app) => app.id === frontmostApp?.id,
  );
  const isFishing =
    !manuallyPaused && activeDistraction === undefined && presence.isPresent;

  let pausedReason = "";
  if (manuallyPaused) {
    pausedReason = "you paused the session";
  } else if (activeDistraction) {
    pausedReason = `${activeDistraction.name} is open`;
  } else if (!presence.isPresent) {
    pausedReason = "away from desk";
  }

  useEffect(() => {
    return onTick((tick) => {
      setFrontmostApp(tick.frontmostApp);
      setPresence((previous) => updatePresence(previous, tick.personVisible));
    });
  }, []);

  useEffect(() => {
    if (session !== "running" || !isFishing) {
      return;
    }

    return onTick(() => setFocusedSeconds((seconds) => seconds + 1));
  }, [session, isFishing]);

  useEffect(() => {
    if (session !== "running" || focusedSeconds < nextCatchAt) {
      return;
    }

    // The camera is required for now, so every session is verified.
    const caught = createCatch(rollFish(), sessionId, true);
    setInventory((previous) => [...previous, caught]);
    setNextCatchAt(focusedSeconds + rollCatchGap());
  }, [session, sessionId, focusedSeconds, nextCatchAt]);

  useEffect(() => {
    saveInventory(inventory);
  }, [inventory]);

  // Keep the widget up to date with what it needs to draw.
  const biteCount = sessionCatches.length;
  useEffect(() => {
    publishSessionInfo({
      active: session === "running",
      isFishing,
      biteCount,
      manuallyPaused,
    });
  }, [session, isFishing, biteCount, manuallyPaused]);

  useEffect(() => {
    return onTogglePauseRequest(() => setManuallyPaused((paused) => !paused));
  }, []);

  useEffect(() => {
    saveDistractions(distractions);
  }, [distractions]);

  async function startSession() {
    try {
      await startCamera();
    } catch (error) {
      setCameraError(String(error));
      return;
    }

    setCameraError("");
    setPresence(INITIAL_PRESENCE);
    setManuallyPaused(false);
    setSessionId(crypto.randomUUID());
    setFocusedSeconds(0);
    setNextCatchAt(rollCatchGap());
    setSession("running");
  }

  function endSession() {
    stopCamera();
    setSession("ended");
  }

  return (
    <div>
      <h1>Desk Angler</h1>

      {cameraError && <div role="alert">{cameraError}</div>}

      {session === "idle" && page === "collection" && (
        <Collection inventory={inventory} onBack={() => setPage("home")} />
      )}

      {session === "idle" && page === "home" && (
        <div>
          <button onClick={startSession}>Start Session</button>
          <button onClick={() => setPage("collection")}>Collection</button>
          <DistractionSettings
            distractions={distractions}
            onChange={setDistractions}
          />
        </div>
      )}

      {session === "running" && (
        <div>
          <Fisherman isFishing={isFishing} biteCount={biteCount} />
          <div>{isFishing ? "Fishing" : `Paused: ${pausedReason}`}</div>
          <div>Focused time: {formatTime(focusedSeconds)}</div>
          <div>Fish in the bucket: {biteCount}</div>

          <button onClick={() => setManuallyPaused(!manuallyPaused)}>
            {manuallyPaused ? "Resume" : "Pause"}
          </button>
          <button onClick={endSession}>End Session</button>
        </div>
      )}

      {session === "ended" && (
        <div>
          <div>Session over. You focused for {formatTime(focusedSeconds)}.</div>

          {sessionCatches.length === 0 ? (
            <div>Nothing bit this time.</div>
          ) : (
            <ul>
              {sessionCatches.map((caught) => {
                const fish = getFish(caught.fishId);
                return (
                  <li key={caught.id}>
                    {fish ? `${fish.name} (${fish.rarity})` : "Unknown fish"}
                  </li>
                );
              })}
            </ul>
          )}

          <button onClick={startSession}>New Session</button>
          <button
            onClick={() => {
              setPage("home");
              setSession("idle");
            }}
          >
            Back to home
          </button>
          <button
            onClick={() => {
              setPage("collection");
              setSession("idle");
            }}
          >
            View collection
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
