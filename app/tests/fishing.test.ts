import { describe, it, expect, vi, afterEach } from "vitest";
import { rollCatchGap } from "../src/game/fishing";

describe("rollCatchGap", () => {
    // Put the real Math.random back after each test so a fake value
    // can't leak into other tests.
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("gives the minimum gap (3 minutes) on the lowest roll", () => {
        vi.spyOn(Math, "random").mockReturnValue(0);
        expect(rollCatchGap()).toBe(3 * 60);
    });
    it("gives the maximum gap (8 minutes) on the highest roll", () => {
        // Math.random never returns exactly 1, so this is the highest it can go.
        vi.spyOn(Math, "random").mockReturnValue(0.9999);
        expect(rollCatchGap()).toBe(8 * 60);
    });
});
