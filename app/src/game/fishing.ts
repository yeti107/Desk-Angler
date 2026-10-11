import { FISH, RARITY_CHANCES, type Fish, type Rarity } from "./fish";

// Focused time between catches, in seconds.
const MIN_CATCH_GAP_SECONDS = 3 * 60;
const MAX_CATCH_GAP_SECONDS = 8 * 60;

// Picks one item at random, where an item with twice the weight is twice as
// likely to be picked.
function pickWeighted<T>(items: T[], getWeight: (item: T) => number): T {
  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
  let roll = Math.random() * totalWeight;

  for (const item of items) {
    roll -= getWeight(item);
    if (roll < 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

export function rollFish(): Fish {
  const rarities = Object.keys(RARITY_CHANCES) as Rarity[];
  const rarity = pickWeighted(rarities, (r) => RARITY_CHANCES[r]);
  const fishInTier = FISH.filter((fish) => fish.rarity === rarity);

  return pickWeighted(fishInTier, (fish) => fish.weight);
}

export function rollCatchGap(): number {
  const range = MAX_CATCH_GAP_SECONDS - MIN_CATCH_GAP_SECONDS + 1;
  return MIN_CATCH_GAP_SECONDS + Math.floor(Math.random() * range);
}
