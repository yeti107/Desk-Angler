import { useEffect, useState } from "react";
import "./App.css";
import Collection from "./components/Collection";
import DistractionSettings from "./components/DistractionSettings";
import Fisherman from "./components/Fisherman";
import FishSprite from "./components/FishSprite";
import Lakeside from "./components/Lakeside";
import Market from "./components/Market";
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
  getPrice,
  loadInventory,
  saveInventory,
  type CaughtFish,
} from "./game/inventory";
import {
  loadDiscoveries,
  saveDiscoveries,
} from "./game/discoveries";
import {
  loadGold,
  saveGold,
} from "./game/gold";
import { INITIAL_PRESENCE, updatePresence } from "./presence";
import { onTogglePauseRequest, publishSessionInfo } from "./widgetBridge";

type SessionState = "idle" | "running" | "ended";
// Which screen to show while no session is running.
type Page = "home" | "collection" | "market" | "settings";

const TABS: { page: Page; label: string }[] = [
  { page: "home", label: "Home" },
  { page: "collection", label: "Collection" },
  { page: "market", label: "Market" },
  { page: "settings", label: "Settings" },
];

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
  const [gold, setGold] = useState<number>(loadGold);
  const [discoveries, setDiscoveries] = useState<string[]>(() => loadDiscoveries(inventory));
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
    setDiscoveries((previous) =>
      previous.includes(caught.fishId)
        ? previous
        : [...previous, caught.fishId],
    );
    setNextCatchAt(focusedSeconds + rollCatchGap());
  }, [session, sessionId, focusedSeconds, nextCatchAt]);

  useEffect(() => {
    saveInventory(inventory);
  }, [inventory]);

  useEffect(() => {
    saveDiscoveries(discoveries);
  }, [discoveries]);

  useEffect(() => {
    saveGold(gold);
  }, [gold]);

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

  // Sells fish and adds their price to the player's gold. `selection` maps a
  // species id to how many of that species to sell. The newest fish of each
  // species are sold first.
  function sellFish(selection: Record<string, number>) {
    const sold: CaughtFish[] = [];

    for (const [fishId, quantity] of Object.entries(selection)) {
      const held = inventory.filter((caught) => caught.fishId === fishId);
      // New catches are added to the end of the inventory, so the newest fish
      // are at the end of `held`. Math.max stops the start going below 0 if
      // the quantity is more than the player holds.
      const start = Math.max(held.length - quantity, 0);
      sold.push(...held.slice(start));
    }

    const soldIds = new Set(sold.map((caught) => caught.id));
    const earned = sold.reduce((sum, caught) => sum + getPrice(caught), 0);

    setInventory((previous) =>
      previous.filter((caught) => !soldIds.has(caught.id)),
    );
    setGold((previous) => previous + earned);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Desk Angler</h1>
        <div className="gold">{gold} gold</div>
      </header>

      {session === "idle" && (
        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.page}
              className={page === tab.page ? "tab active" : "tab"}
              aria-current={page === tab.page ? "page" : undefined}
              onClick={() => setPage(tab.page)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      {cameraError && (
        <div className="alert" role="alert">
          {cameraError}
        </div>
      )}

      {session === "idle" && page === "home" && (
        <div className="home">
          <p className="muted">
            Start a session and the fisherman fishes while you focus.
          </p>
          <button className="primary start-button" onClick={startSession}>
            Start Session
          </button>
          <Lakeside />
        </div>
      )}

      {session === "idle" && page === "collection" && (
        <Collection inventory={inventory} discoveries={discoveries} />
      )}

      {session === "idle" && page === "market" && (
        <Market inventory={inventory} onSell={sellFish} />
      )}

      {session === "idle" && page === "settings" && (
        <DistractionSettings
          distractions={distractions}
          onChange={setDistractions}
        />
      )}

      {session === "running" && (
        <div className="session">
          <Fisherman isFishing={isFishing} biteCount={biteCount} />
          <div className="session-status">
            {isFishing ? "Fishing..." : `Paused: ${pausedReason}`}
          </div>
          <div className="session-stats">
            <span>Focused {formatTime(focusedSeconds)}</span>
            <span>Bites: {biteCount}</span>
          </div>

          <div className="button-row">
            <button onClick={() => setManuallyPaused(!manuallyPaused)}>
              {manuallyPaused ? "Resume" : "Pause"}
            </button>
            <button className="primary" onClick={endSession}>
              End Session
            </button>
          </div>
        </div>
      )}

      {session === "ended" && (
        <div className="panel">
          <h2>Session over</h2>
          <p className="muted">You focused for {formatTime(focusedSeconds)}.</p>

          {sessionCatches.length === 0 ? (
            <p>Nothing bit this time.</p>
          ) : (
            <ul className="catch-list">
              {sessionCatches.map((caught) => {
                const fish = getFish(caught.fishId);
                return (
                  <li key={caught.id}>
                    <span className="fish-line">
                      {fish && <FishSprite fish={fish} size={32} />}
                      {fish ? fish.name : "Unknown fish"}
                    </span>
                    {fish && (
                      <span className={`rarity rarity-${fish.rarity}`}>
                        {fish.rarity}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="button-row">
            <button className="primary" onClick={startSession}>
              New Session
            </button>
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
        </div>
      )}
    </div>
  );
}

export default App;
