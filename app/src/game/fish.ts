export type Rarity = "common" | "uncommon" | "rare" | "legendary";

// Chance of each rarity tier per catch. These are relative weights, so they
// don't have to add up to 100.
export const RARITY_CHANCES: Record<Rarity, number> = {
  common: 70,
  uncommon: 20,
  rare: 8,
  legendary: 2,
};

export type Fish = {
  id: string;
  name: string;
  rarity: Rarity;
  // Chance of this fish relative to the others in the same rarity tier.
  weight: number;
};

export function getFish(fishId: string) {
  return FISH.find((fish) => fish.id === fishId);
}

// Placeholder fish until the real roster is designed.
export const FISH: Fish[] = [
  { id: "minnow", name: "Minnow", rarity: "common", weight: 1 },
  { id: "perch", name: "Perch", rarity: "common", weight: 1 },
  { id: "roach", name: "Roach", rarity: "common", weight: 1 },
  { id: "trout", name: "Trout", rarity: "uncommon", weight: 1 },
  { id: "carp", name: "Carp", rarity: "uncommon", weight: 1 },
  { id: "pike", name: "Pike", rarity: "rare", weight: 1 },
  { id: "catfish", name: "Catfish", rarity: "rare", weight: 1 },
  { id: "golden-koi", name: "Golden Koi", rarity: "legendary", weight: 1 },
];
