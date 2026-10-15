import "./Fisherman.css";

type FishermanProps = {
  isFishing: boolean;
  // How many fish have bitten so far. Each increase replays the bite animation.
  biteCount: number;
  // Draw only the fisherman on a short bit of dock with a small patch of
  // water, and leave the rest see-through. Used by the floating widget.
  cutout?: boolean;
};

// Placeholder art. The scene is a 64x40 grid where one unit is one "pixel".
// Sky, water and trees take their colours from CSS (see
// Fisherman.css), so they can change for dark mode. Everything else has
// fixed colours.

// The fisherman, seated on the end of the dock and facing right. Each
// character is one pixel; see FISHERMAN_COLOURS for what they mean.
const FISHERMAN = [
  "...oooooo...",
  "..oHHHHHHo..",
  "..ohHHHHHo..",
  "oohhhhhhhhoo",
  "..oSssssesso",
  "..oSssssssso",
  "..oBBBbbbBo.",
  "..ooBBBBBo..",
  ".oyyyyyyyo..",
  "oYYyyyyyyyo.",
  "oYyyyyyysss.",
  "oYyyyyyyyo..",
  "oYyyyyyyyo..",
  "oggggggggggo",
  "oGGGGGGGgggo",
  ".oooooooogGo",
  "........ogGo",
  "........ogGo",
  "........okkko",
  "........ooooo",
];

const FISHERMAN_COLOURS: Record<string, string> = {
  o: "#2a1d14", // outline
  H: "#c9b26a", // hat
  h: "#a08a48", // hat shadow and brim
  s: "#f0c8a0", // skin
  S: "#d9a57e", // skin shadow
  e: "#141414", // eye
  B: "#7a4a2a", // beard
  b: "#946038", // beard highlight
  y: "#f2c230", // raincoat
  Y: "#c99a1c", // raincoat shadow
  g: "#3f7a4a", // waders
  G: "#2d5a36", // waders shadow
  k: "#2b2b2b", // boots
};

// Where the fisherman grid is drawn, and where his hand is (the rod's base).
const FISHERMAN_X = 16;
const FISHERMAN_Y = 9;
const HAND_X = 26;
const HAND_Y = 19;

// Height of the far treeline at each column from x = 24 to 63.
const TREE_HEIGHTS = [
  2, 3, 3, 4, 5, 6, 6, 5, 4, 4, 5, 6, 7, 7, 6, 5, 4, 3, 4, 5,
  6, 6, 5, 4, 4, 5, 6, 7, 8, 7, 6, 5, 5, 6, 5, 4, 3, 3, 4, 3,
];

// Reeds on the right: where they stand, how tall, and when they sway.
const REEDS = [
  { x: 57, height: 7, delay: 0 },
  { x: 59, height: 10, delay: 0.7 },
  { x: 61, height: 8, delay: 0.3 },
  { x: 63, height: 11, delay: 1.1 },
];
const WATER_TOP = 28;

function drawGrid(
  grid: string[],
  colours: Record<string, string>,
  originX: number,
  originY: number,
) {
  const pixels = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const fill = colours[grid[y][x]];
      if (fill) {
        pixels.push(
          <rect
            key={`${x}-${y}`}
            x={originX + x}
            y={originY + y}
            width="1"
            height="1"
            style={{ fill }}
          />,
        );
      }
    }
  }
  return pixels;
}

function Fisherman({ isFishing, biteCount, cutout = false }: FishermanProps) {
  let className = "fisherman-scene";
  if (cutout) {
    className += " cutout";
  }
  if (!isFishing) {
    className += " paused";
  }

  return (
    <svg
      className={className}
      viewBox="0 0 64 40"
      shapeRendering="crispEdges"
      role="img"
      aria-label={isFishing ? "Fisherman fishing" : "Fisherman paused"}
    >
      {cutout ? (
        <>
          {/* A small patch of water under his feet and the bobber */}
          <rect className="water" x="16" y={WATER_TOP} width="38" height="3" />
          <rect className="water" x="18" y="31" width="34" height="1" />
          <rect className="water-top" x="16" y={WATER_TOP} width="38" height="1" />
          <rect className="water-light" x="30" y="30" width="4" height="1" />

          {/* A short stub of dock, with the bucket */}
          <rect x="19" y="26" width="2" height="5" fill="#6b4421" />
          <rect x="20" y="26" width="1" height="5" fill="#553418" />
          <rect x="9" y="24" width="15" height="1" fill="#a8763e" />
          <rect x="9" y="25" width="15" height="1" fill="#7a4f26" />
          <rect x="17" y="24" width="1" height="1" fill="#7a4f26" />
          <rect x="10" y="21" width="4" height="3" fill="#8a9ba8" />
          <rect x="10" y="21" width="4" height="1" fill="#5d6a72" />
          <rect x="11" y="20" width="1" height="1" fill="#e67e22" />
        </>
      ) : (
        <>
        {/* Sky, in bands from top to horizon */}
        <rect className="sky-1" x="0" y="0" width="64" height="8" />
        <rect className="sky-2" x="0" y="8" width="64" height="7" />
        <rect className="sky-3" x="0" y="15" width="64" height="6" />
        <rect className="sky-4" x="0" y="21" width="64" height="7" />

        {/* Sun by day, moon at dusk. CSS shows one of them. */}
        <g className="sun">
          <rect x="4" y="3" width="4" height="6" fill="#ffd34d" />
          <rect x="3" y="4" width="6" height="4" fill="#ffd34d" />
          <rect x="5" y="4" width="2" height="2" fill="#fff1a8" />
        </g>
        <g className="moon">
          <rect x="4" y="3" width="4" height="6" fill="#f4f0d8" />
          <rect x="3" y="4" width="6" height="4" fill="#f4f0d8" />
          <rect x="6" y="4" width="2" height="2" fill="#d8d2b4" />
          <rect x="4" y="6" width="1" height="1" fill="#d8d2b4" />
        </g>

        {/* Far treeline on the opposite shore */}
        {TREE_HEIGHTS.map((height, i) => (
          <rect
            key={i}
            className={i % 7 < 3 ? "trees-light" : "trees"}
            x={24 + i}
            y={WATER_TOP - height}
            width="1"
            height={height}
          />
        ))}

        {/* Water, in bands, with a few highlights */}
        <rect className="water" x="0" y={WATER_TOP} width="64" height="12" />
        <rect className="water-top" x="0" y={WATER_TOP} width="64" height="1" />
        <rect className="water-deep" x="0" y="36" width="64" height="4" />
        <rect className="water-light" x="30" y="31" width="5" height="1" />
        <rect className="water-light" x="50" y="30" width="3" height="1" />
        <rect className="water-light" x="36" y="35" width="4" height="1" />
        <rect className="water-light" x="10" y="37" width="4" height="1" />

        {/* Lily pads, one with a flower */}
        <rect x="48" y="34" width="5" height="2" fill="#4f9a4a" />
        <rect x="50" y="34" width="1" height="1" className="water" />
        <rect x="49" y="36" width="3" height="1" fill="#3d7a3a" />
        <rect x="51" y="33" width="1" height="1" fill="#f6a5c0" />
        <rect x="52" y="33" width="1" height="1" fill="#fbd3e0" />
        <rect x="40" y="38" width="4" height="1" fill="#4f9a4a" />

        {/* Reeds on the right. The lower stem stays still; the top sways. */}
        {REEDS.map((reed) => {
          const top = WATER_TOP + 2 - reed.height;
          return (
            <g key={reed.x}>
              <rect
                x={reed.x}
                y={top + 3}
                width="1"
                height={reed.height - 3}
                fill="#4f8a3a"
              />
              <g
                className="scene-reed-tip"
                style={{ animationDelay: `${reed.delay}s` }}
              >
                <rect x={reed.x} y={top} width="1" height="3" fill="#6b4421" />
              </g>
            </g>
          );
        })}

        {/* Dock: posts, planks with grain, a tackle box and a bucket */}
        <rect x="5" y="26" width="2" height="14" fill="#6b4421" />
        <rect x="6" y="26" width="1" height="14" fill="#553418" />
        <rect x="19" y="26" width="2" height="14" fill="#6b4421" />
        <rect x="20" y="26" width="1" height="14" fill="#553418" />
        <rect x="0" y="24" width="24" height="1" fill="#a8763e" />
        <rect x="0" y="25" width="24" height="1" fill="#7a4f26" />
        <rect x="4" y="24" width="1" height="1" fill="#7a4f26" />
        <rect x="11" y="24" width="1" height="1" fill="#7a4f26" />
        <rect x="17" y="24" width="1" height="1" fill="#7a4f26" />

        <rect x="2" y="20" width="7" height="4" fill="#b8433a" />
        <rect x="2" y="20" width="7" height="1" fill="#8e2f28" />
        <rect x="4" y="19" width="3" height="1" fill="#2a1d14" />
        <rect x="5" y="22" width="1" height="1" fill="#e8c04a" />

        <rect x="10" y="21" width="4" height="3" fill="#8a9ba8" />
        <rect x="10" y="21" width="4" height="1" fill="#5d6a72" />
        <rect x="11" y="20" width="1" height="1" fill="#e67e22" />
        </>
      )}

      {/* The fisherman */}
      {drawGrid(FISHERMAN, FISHERMAN_COLOURS, FISHERMAN_X, FISHERMAN_Y)}

      {isFishing ? (
        <>
          {/* Rod cast out over the water */}
          <line
            x1={HAND_X}
            y1={HAND_Y}
            x2="44"
            y2="6"
            stroke="#5b3a1a"
            strokeWidth="1"
          />
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
              <rect x="21" y="1" width="2" height="5" fill="#e67e22" />
              <rect x="21" y="7" width="2" height="1" fill="#e67e22" />
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
          <line
            x1={HAND_X}
            y1={HAND_Y}
            x2="29"
            y2="4"
            stroke="#5b3a1a"
            strokeWidth="1"
          />
          {/* Pause icon above the hat */}
          <rect x="20" y="2" width="1" height="5" fill="#2c3e50" />
          <rect x="23" y="2" width="1" height="5" fill="#2c3e50" />
        </>
      )}
    </svg>
  );
}

export default Fisherman;
