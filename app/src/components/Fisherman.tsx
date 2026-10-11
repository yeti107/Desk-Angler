import "./Fisherman.css";

type FishermanProps = {
  isFishing: boolean;
  // How many fish have bitten so far. Each increase replays the bite animation.
  biteCount: number;
};

// Placeholder art. The scene is a 64x40 grid where one unit is one "pixel".
function Fisherman({ isFishing, biteCount }: FishermanProps) {
  return (
    <svg
      className={isFishing ? "fisherman-scene" : "fisherman-scene paused"}
      viewBox="0 0 64 40"
      shapeRendering="crispEdges"
      role="img"
      aria-label={isFishing ? "Fisherman fishing" : "Fisherman paused"}
    >
      {/* Sky and water */}
      <rect x="0" y="0" width="64" height="40" fill="#bfe3f0" />
      <rect x="0" y="28" width="64" height="12" fill="#3b7dbd" />
      <rect x="30" y="31" width="5" height="1" fill="#6fa8dc" />
      <rect x="50" y="34" width="6" height="1" fill="#6fa8dc" />
      <rect x="10" y="36" width="4" height="1" fill="#6fa8dc" />

      {/* Dock */}
      <rect x="6" y="26" width="2" height="14" fill="#6b4421" />
      <rect x="20" y="26" width="2" height="14" fill="#6b4421" />
      <rect x="0" y="24" width="24" height="2" fill="#8b5a2b" />

      {/* Fisherman */}
      <rect x="18" y="9" width="4" height="2" fill="#d9b34a" />
      <rect x="16" y="11" width="8" height="1" fill="#d9b34a" />
      <rect x="18" y="12" width="4" height="4" fill="#f0c8a0" />
      <rect x="17" y="16" width="6" height="6" fill="#c0392b" />
      <rect x="22" y="17" width="4" height="2" fill="#f0c8a0" />
      <rect x="18" y="22" width="8" height="2" fill="#2c3e50" />
      <rect x="24" y="24" width="2" height="4" fill="#2c3e50" />

      {isFishing ? (
        <>
          {/* Rod cast out over the water */}
          <line x1="25" y1="18" x2="44" y2="6" stroke="#5b3a1a" strokeWidth="1" />
          <line x1="44" y1="6" x2="44" y2="24" stroke="#ffffff" strokeWidth="0.5" />

          <g
            key={biteCount}
            className={biteCount > 0 ? "bobber bitten" : "bobber"}
          >
            <line x1="44" y1="20" x2="44" y2="27" stroke="#ffffff" strokeWidth="0.5" />
            <rect x="43" y="27" width="2" height="1" fill="#ffffff" />
            <rect x="43" y="28" width="2" height="1" fill="#e74c3c" />
          </g>

          {biteCount > 0 && (
            <g key={`bite-${biteCount}`} className="bite">
              {/* Exclamation mark above the hat */}
              <rect x="19" y="1" width="2" height="5" fill="#e67e22" />
              <rect x="19" y="7" width="2" height="1" fill="#e67e22" />
              {/* Splash around the bobber */}
              <rect x="41" y="26" width="1" height="1" fill="#ffffff" />
              <rect x="46" y="26" width="1" height="1" fill="#ffffff" />
              <rect x="40" y="28" width="1" height="1" fill="#ffffff" />
              <rect x="47" y="28" width="1" height="1" fill="#ffffff" />
            </g>
          )}
        </>
      ) : (
        <>
          {/* Rod held upright, line reeled in */}
          <line x1="25" y1="18" x2="28" y2="4" stroke="#5b3a1a" strokeWidth="1" />
          {/* Pause icon above the hat */}
          <rect x="18" y="2" width="1" height="5" fill="#2c3e50" />
          <rect x="21" y="2" width="1" height="5" fill="#2c3e50" />
        </>
      )}
    </svg>
  );
}

export default Fisherman;
