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

// Species the player has ever caught a shiny of. Kept separately so the
// Collection's shiny marker stays even after the shiny is sold.
const SHINY_DISCOVERY_KEY = "shinyDiscovered";

export function loadShinyDiscoveries(inventory: CaughtFish[]) {
  const shinySpeciesIds = inventory
    .filter((caught) => caught.isShiny)
    .map((caught) => caught.fishId);
  return loadJson<string[]>(SHINY_DISCOVERY_KEY, [...new Set(shinySpeciesIds)]);
}

export function saveShinyDiscoveries(shinyDiscoveries: string[]) {
  saveJson(SHINY_DISCOVERY_KEY, shinyDiscoveries);
}
