import { loadJson, saveJson } from "../storage";
import { type CaughtFish } from "./inventory";

const DISCOVERY_KEY = "discovered";

export function loadDiscoveries(inventory: CaughtFish[]) {
  const caughtSpeciesIds = inventory.map((caught) => caught.fishId);
  const caughtSpecies = [...new Set(caughtSpeciesIds)];
  return loadJson<string[]>(DISCOVERY_KEY, caughtSpecies);
}

export function saveDiscoveries(discoveries: string[]) {
  saveJson(DISCOVERY_KEY, discoveries);
}