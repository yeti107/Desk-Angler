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
  length: {min: number; max: number;}; // cm
  fishWeight: {min: number; max: number;}; // kg
};

export function getFish(fishId: string) {
  return FISH.find((fish) => fish.id === fishId);
}

// Placeholder fish until the real roster is designed.
export const FISH: Fish[] = [
  { id: "minnow", name: "Minnow", rarity: "common", weight: 1, length: {min:3, max:10}, fishWeight: {min:0.002, max:0.015} },
  { id: "perch", name: "Perch", rarity: "common", weight: 1, length: {min:15, max:40}, fishWeight: {min:0.1, max:1.5}  },
  { id: "roach", name: "Roach", rarity: "common", weight: 1, length: {min:10, max:35}, fishWeight: {min:0.05, max:1} },
  { id: "bluegill", name: "Bluegill", rarity: "common", weight: 1, length: {min:10, max:30}, fishWeight: {min:0.05, max:1} },
  { id: "smelt", name: "Smelt", rarity: "common", weight: 1, length: {min:10, max:25}, fishWeight: {min:0.01, max:0.15} },
  { id: "guppy", name: "Guppy", rarity: "common", weight: 1, length: {min:2, max:6}, fishWeight: {min:0.0005, max:0.003} },
  { id: "seahorse", name: "Seahorse", rarity: "common", weight: 1, length: {min:5, max:30}, fishWeight: {min:0.005, max:0.03} },
  { id: "trout", name: "Trout", rarity: "uncommon", weight: 1, length: {min:25, max:75}, fishWeight: {min:0.2, max:5} },
  { id: "carp", name: "Carp", rarity: "uncommon", weight: 1, length: {min:30, max:100}, fishWeight: {min:1, max:20} },
  { id: "bass", name: "Bass", rarity: "uncommon", weight: 1, length: {min:25, max:65}, fishWeight: {min:0.5, max:5} },
  { id: "bream", name: "Bream", rarity: "uncommon", weight: 1, length: {min:25, max:60}, fishWeight: {min:0.5, max:5} },
  { id: "mackerel", name: "Mackerel", rarity: "uncommon", weight: 1, length: {min:25, max:50}, fishWeight: {min:0.2, max:1.5} },
  { id: "stingray", name: "Stingray", rarity: "uncommon", weight: 1, length: {min:40, max:180}, fishWeight: {min:3, max:80} },
  { id: "pike", name: "Pike", rarity: "rare", weight: 1, length: {min:40, max:130}, fishWeight: {min:1, max:20} },
  { id: "catfish", name: "Catfish", rarity: "rare", weight: 1, length: {min:30, max:130}, fishWeight: {min:1, max:25} },
  { id: "eel", name: "Eel", rarity: "rare", weight: 1, length: {min:40, max:120}, fishWeight: {min:0.3, max:4} },
  { id: "barracuda", name: "Barracuda", rarity: "rare", weight: 1, length: {min:50, max:180}, fishWeight: {min:2, max:40} },
  { id: "lionfish", name: "Lionfish", rarity: "rare", weight: 1, length: {min:15, max:40}, fishWeight: {min:0.2, max:1.3} },
  { id: "great-white", name: "Great White", rarity: "legendary", weight: 1, length: {min:300, max:600}, fishWeight: {min:500, max:2000} },
  { id: "anglerfish", name: "Anglerfish", rarity: "legendary", weight: 1, length: {min:20, max:100}, fishWeight: {min:0.5, max:25} },
];

//   pricing for fish
export const RARITY_PRICES: Record<Rarity, number> = {
  common: 20,
  uncommon: 30,
  rare: 45,
  legendary: 100,
};
