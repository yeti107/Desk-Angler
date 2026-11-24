import { describe, it, expect } from "vitest";
import { FISH, RARITY_CHANCES, type Rarity } from "../src/game/fish";

describe("fish roster", () => {
    it("has at least one fish in every rarity tier", () => {
        const rarities = Object.keys(RARITY_CHANCES) as Rarity[];
        for (const rarity of rarities) {
            const fishInTier = FISH.filter((fish) => fish.rarity === rarity);
            // The second argument names the failing tier in the error message.
            expect(fishInTier.length, `no fish in tier "${rarity}"`).toBeGreaterThan(0);
        }
    });
});
