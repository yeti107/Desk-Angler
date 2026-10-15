import { loadJson, saveJson } from "../storage";
import { type Fish, RARITY_PRICES, getFish } from "./fish";

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
};

export function createCatch(
  fish: Fish,
  sessionId: string,
  verified: boolean,
): CaughtFish {
  return {
    id: crypto.randomUUID(),
    fishId: fish.id,
    caughtAt: new Date().toISOString(),
    sessionId,
    verified,
  };
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
