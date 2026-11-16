import { loadJson, saveJson } from "../storage";
import { type Fish, RARITY_PRICES, getFish, rollSizeFraction } from "./fish";

// One individual fish the player caught. Each catch is its own record, not a
// count per species, so a single fish can later be sold or traded.
export type CaughtFish = {
  id: string;
  // Which species this is. We store the id, not the name or rarity, so
  // changes to the roster apply to fish that were already caught.
  fishId: string;
  // ISO date string, e.g. "2026-10-11T14:03:22.000Z".
  caughtAt: string;
  sessionId: string;
  // Whether the session was confirmed by the camera.
  verified: boolean;
  length?: number; // cm
  fishWeight?: number; // kg
};

export function createCatch(
  fish: Fish,
  sessionId: string,
  verified: boolean,
): CaughtFish {
  const fraction = rollSizeFraction();
  const length = fish.length.min + (fish.length.max - fish.length.min) * fraction;
  const fishWeight = fish.fishWeight.min + (fish.fishWeight.max - fish.fishWeight.min) * fraction;
  return {
    id: crypto.randomUUID(),
    fishId: fish.id,
    caughtAt: new Date().toISOString(),
    sessionId,
    verified,
    length,
    fishWeight,
  };
}

// Display text for a caught fish's length (stored in cm), e.g. "17.4 cm".
export function describeLength(length?: number): string {
  if (length === undefined) {
    return "unmeasured";
  }
  return `${length.toFixed(1)} cm`;
}

// Display text for a caught fish's weight (stored in kg). Under 1 kg it's
// shown in grams, e.g. "450 g"; from 1 kg up in kg, e.g. "1843.3 kg".
export function describeWeight(fishWeight?: number): string {
  if (fishWeight === undefined) {
    return "unmeasured";
  }
  if (fishWeight < 1) {
    const grams = fishWeight * 1000;
    // Tiny fish (a 0.5 g guppy) would round to "1 g" or "0 g" without a decimal.
    if (grams < 10) {
      return `${grams.toFixed(1)} g`;
    }
    return `${grams.toFixed(0)} g`;
  }
  return `${fishWeight.toFixed(1)} kg`;
}

// Length and weight together for display, e.g. "17.4 cm · 450 g". Fish caught
// before sizes existed have neither, so they just say "unmeasured" once.
export function describeSize(caught: CaughtFish): string {
  if (caught.length === undefined || caught.fishWeight === undefined) {
    return "unmeasured";
  }
  return `${describeLength(caught.length)} · ${describeWeight(caught.fishWeight)}`;
}


const INVENTORY_KEY = "inventory";

export function loadInventory() {
  return loadJson<CaughtFish[]>(INVENTORY_KEY, []);
}

export function saveInventory(inventory: CaughtFish[]) {
  saveJson(INVENTORY_KEY, inventory);
}

export function getPrice(caught: CaughtFish): number {
  const fish = getFish(caught.fishId);
  if (!fish) {
       return 0; // sentinel value (should never occur)
    }
  return RARITY_PRICES[fish.rarity];
}
