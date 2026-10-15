import type { Fish } from "../game/fish";

// Placeholder pixel art until the real fish are drawn. Each fish's shape,
// colours and pattern are worked out from its id, so the same fish always
// looks the same and new fish get art automatically.

// Body shapes, facing right. Each character is one pixel:
// . empty   o outline   b body   l belly   f fins and tail   e eye
// w teeth   g glowing lure
const SHAPES = {
  classic: [
    "......fff.......",
    "....oooooooo....",
    "f..obbbbbbbbo...",
    "ff.obbbbbbbbebo.",
    "fffobbbbbbbbbbbo",
    "ff.ollllllllllo.",
    "f..ollllllllo...",
    "....oooooooo....",
    "......ff........",
  ],
  long: [
    "......fff.......",
    "...oooooooooooo.",
    "ff.obbbbbbbbbebo",
    "fffolllllllllllo",
    "ff.ooooooooooooo",
    "........ff......",
  ],
  round: [
    ".....ff.......",
    "....oooooo....",
    "...obbbbbbo...",
    "f.obbbbbbbbo..",
    "ffobbbbbbbebo.",
    "ffobbbbbbbbbbo",
    "f.olllllllllo.",
    "...ollllllo...",
    "....oooooo....",
    ".....ff.......",
  ],
  shark: [
    "......f.........",
    ".....ff.........",
    "f...oooooooo....",
    "ff.obbbbbbbbboo.",
    "fffobbbbbbbbbebo",
    "ff.olllllllllllo",
    "f...ollllllloo..",
    ".....oooooof....",
    "..........f.....",
  ],
  // Seen from above: a diamond with a long tail.
  ray: [
    "..........oo....",
    ".........obbo...",
    "........obbbbo..",
    ".......obbbbbbo.",
    "ffffffobbbbbbebo",
    "......obbbbbbbbo",
    ".......obbbbbbo.",
    "........obbbbo..",
    ".........obbo...",
    "..........oo....",
  ],
  seahorse: [
    "...ooo....",
    "..obbbo...",
    "..obebbooo",
    "..obbbbbbo",
    "...obbooo.",
    "..fobllo..",
    ".ffobllo..",
    "..fobllo..",
    "...obbo...",
    "..ooo.....",
  ],
  angler: [
    "........fff.....",
    ".......f...f....",
    "....oooooo..ggg.",
    "f..obbbbbbo..g..",
    "ff.obbbbbebo....",
    "fffobbbbbbbbo...",
    "ff.obbbbwbwbwo..",
    "f..ollllllllo...",
    "....oooooooo....",
  ],
};

type ShapeName = keyof typeof SHAPES;

// Most fish get one of these, picked from their id.
const RANDOM_SHAPES: ShapeName[] = ["classic", "long", "round"];

// Fish that need a particular shape to look right.
const SHAPE_FOR: Record<string, ShapeName> = {
  "great-white": "shark",
  stingray: "ray",
  seahorse: "seahorse",
  anglerfish: "angler",
};

// Every sprite is drawn on a canvas this size, so all fish line up.
const CANVAS_WIDTH = 16;
const CANVAS_HEIGHT = 10;

type Pattern = "plain" | "stripes" | "spots";
const PATTERNS: Pattern[] = ["plain", "stripes", "spots"];

// Turns a string into a whole number that's always the same for that string.
function hashString(text: string) {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function getLook(fish: Fish) {
  const hash = hashString(fish.id);
  const shapeName =
    SHAPE_FOR[fish.id] ??
    RANDOM_SHAPES[Math.floor(hash / 7) % RANDOM_SHAPES.length];
  const isShark = shapeName === "shark";

  // Sharks are plain steel grey. Other legendary fish are golden, and
  // everything else gets a colour from its id.
  let hue = hash % 360;
  let saturation = 55;
  if (isShark) {
    hue = 210;
    saturation = 15;
  } else if (fish.rarity === "legendary") {
    hue = 42;
    saturation = 85;
  }

  return {
    shape: SHAPES[shapeName],
    pattern: isShark
      ? "plain"
      : PATTERNS[Math.floor(hash / 13) % PATTERNS.length],
    colours: {
      o: `hsl(${hue} 40% 22%)`,
      b: `hsl(${hue} ${saturation}% 55%)`,
      l: `hsl(${hue} ${saturation}% 78%)`,
      f: `hsl(${(hue + 25) % 360} ${saturation}% 45%)`,
      e: "#141414",
      w: "#ffffff",
      g: "#fff38a",
      mark: `hsl(${hue} ${saturation}% 38%)`,
    },
  };
}

type FishSpriteProps = {
  fish: Fish;
  // Width in pixels on screen.
  size?: number;
  // Draw a plain dark shape, for species not discovered yet.
  silhouette?: boolean;
};

function FishSprite({ fish, size = 48, silhouette = false }: FishSpriteProps) {
  const { shape, pattern, colours } = getLook(fish);
  // Centre the shape on the canvas.
  const offsetX = Math.floor((CANVAS_WIDTH - shape[0].length) / 2);
  const offsetY = Math.floor((CANVAS_HEIGHT - shape.length) / 2);

  const pixels = [];
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      const cell = shape[y][x];
      if (cell === ".") {
        continue;
      }

      let fill = colours[cell as keyof typeof colours];
      if (cell === "b" && pattern === "stripes" && x % 3 === 0) {
        fill = colours.mark;
      }
      if (cell === "b" && pattern === "spots" && (x + y * 2) % 5 === 0) {
        fill = colours.mark;
      }
      if (silhouette) {
        fill = "currentColor";
      }

      pixels.push(
        <rect
          key={`${x}-${y}`}
          x={x + offsetX}
          y={y + offsetY}
          width="1"
          height="1"
          fill={fill}
        />,
      );
    }
  }

  return (
    <svg
      className={silhouette ? "fish-sprite silhouette" : "fish-sprite"}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      width={size}
      height={(size * CANVAS_HEIGHT) / CANVAS_WIDTH}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {pixels}
    </svg>
  );
}

export default FishSprite;
