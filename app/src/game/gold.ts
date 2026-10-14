import { loadJson, saveJson } from "../storage";

const GOLD_KEY = "gold";

export function loadGold() {
  return loadJson<number>(GOLD_KEY, 0);
}

export function saveGold(gold: number) {
  saveJson(GOLD_KEY, gold);
}