import { useState } from "react";
import "./Lakeside.css";

// Decorative water, dock and reeds along the bottom of the home screen.
// The scene is a 200x30 grid where one unit is one "pixel".

// Wave highlights repeat every WAVE_PERIOD units. The wave layers are drawn
// one period wider than the scene and slide left by exactly one period, so
// the loop has no visible jump.
const WAVE_PERIOD = 25;
const WAVE_REPEATS = Array.from({ length: 200 / WAVE_PERIOD + 1 }, (_, i) => i);

// Each reed: where it stands, how tall it is, and when its sway starts.
const REEDS = [
  { x: 40, height: 9, delay: 0 },
  { x: 43, height: 12, delay: 0.6 },
  { x: 171, height: 11, delay: 0.3 },
  { x: 175, height: 14, delay: 1.1 },
  { x: 179, height: 10, delay: 0.8 },
  { x: 186, height: 13, delay: 0.2 },
  { x: 191, height: 9, delay: 1.4 },
];

const WATER_TOP = 18;

// The jumping fish appears somewhere in open water, away from the dock and
// the bank. Its jump covers 12 units, so it must start by x = 150.
function randomJumpX() {
  return 50 + Math.floor(Math.random() * 100);
}

function Lakeside() {
  const [jumpX, setJumpX] = useState(randomJumpX);

  return (
    <svg
      className="lakeside"
      viewBox="0 0 200 30"
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Jumping fish. It's drawn before the water, so the water hides it
          while it's under the surface. It moves to a new spot each time its
          animation loops, while it's out of sight. */}
      <g transform={`translate(${jumpX} ${WATER_TOP - 1})`}>
        <g
          className="jumping-fish"
          onAnimationIteration={() => setJumpX(randomJumpX())}
        >
          <rect className="fish-body" x="0" y="0" width="1" height="1" />
          <rect className="fish-body" x="0" y="2" width="1" height="1" />
          <rect className="fish-body" x="1" y="1" width="1" height="1" />
          <rect className="fish-body" x="2" y="0" width="3" height="3" />
          <rect className="fish-body" x="5" y="1" width="1" height="1" />
          <rect className="fish-eye" x="4" y="1" width="1" height="1" />
        </g>
      </g>

      {/* Water */}
      <rect className="water" x="0" y={WATER_TOP} width="200" height="12" />
      <rect className="water-edge" x="0" y={WATER_TOP} width="200" height="1" />

      {/* Two wave layers moving at different speeds give a bit of depth. */}
      <g className="waves waves-slow">
        {WAVE_REPEATS.map((i) => (
          <g key={i} transform={`translate(${i * WAVE_PERIOD} 0)`}>
            <rect className="wave" x="3" y="21" width="4" height="1" />
            <rect className="wave" x="15" y="26" width="5" height="1" />
          </g>
        ))}
      </g>
      <g className="waves waves-fast">
        {WAVE_REPEATS.map((i) => (
          <g key={i} transform={`translate(${i * WAVE_PERIOD} 0)`}>
            <rect className="wave" x="10" y="23" width="3" height="1" />
            <rect className="wave" x="21" y="28" width="3" height="1" />
          </g>
        ))}
      </g>

      {/* Splashes where the fish leaves and re-enters the water. These are
          drawn after the water so they show on top of it. */}
      <g transform={`translate(${jumpX} ${WATER_TOP - 1})`}>
        <g className="splash splash-out">
          <rect className="splash-drop" x="0" y="0" width="1" height="1" />
          <rect className="splash-drop" x="5" y="0" width="1" height="1" />
          <rect className="splash-drop" x="-1" y="1" width="1" height="1" />
          <rect className="splash-drop" x="6" y="1" width="1" height="1" />
        </g>
        <g className="splash splash-in">
          <rect className="splash-drop" x="12" y="0" width="1" height="1" />
          <rect className="splash-drop" x="17" y="0" width="1" height="1" />
          <rect className="splash-drop" x="11" y="1" width="1" height="1" />
          <rect className="splash-drop" x="18" y="1" width="1" height="1" />
        </g>
      </g>

      {/* Dock on the left, with a bucket of fish */}
      <rect className="dock-post" x="6" y="16" width="2" height="14" />
      <rect className="dock-post" x="26" y="16" width="2" height="14" />
      <rect className="dock" x="0" y="14" width="34" height="2" />
      <rect className="bucket" x="19" y="10" width="5" height="4" />
      <rect className="bucket-rim" x="18" y="10" width="7" height="1" />
      <rect className="fish-tail" x="20" y="8" width="1" height="2" />
      <rect className="fish-tail" x="22" y="9" width="1" height="1" />

      {/* Bank on the right */}
      <rect className="bank" x="166" y="17" width="34" height="13" />
      <rect className="grass" x="166" y="16" width="34" height="2" />

      {/* Reeds. The lower stem stays still; the top sways. */}
      {REEDS.map((reed) => {
        const top = WATER_TOP - reed.height;
        return (
          <g key={reed.x}>
            <rect
              className="reed"
              x={reed.x}
              y={top + 4}
              width="1"
              height={reed.height - 4}
            />
            <g className="reed-tip" style={{ animationDelay: `${reed.delay}s` }}>
              <rect className="reed" x={reed.x} y={top} width="1" height="4" />
              <rect className="cattail" x={reed.x} y={top} width="1" height="3" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export default Lakeside;
