import {describe, it, expect } from "vitest";
import { describeLength, describeWeight, type CaughtFish, getPrice, marketGroupKey } from "../src/game/inventory";

describe("describeLength",  () => {
    it("says unmeasured when there's no length", () => {
        expect(describeLength(undefined)).toBe("unmeasured");
    });
    it("displays the correct length from a given value", () => {
        expect(describeLength(17.43)).toBe("17.4 cm");
    });
});

describe("describeWeight", () => {
    it("says unmeasured when there's no weight", () => {
        expect(describeWeight(undefined)).toBe("unmeasured");
    });
    it("returns very small weights as grams correctly", () => {
        expect(describeWeight(0.0006)).toBe("0.6 g");
    });
    it("returns a normal weight fish as grams correctly", () => {
        expect(describeWeight(0.6)).toBe("600 g");
    });
    it("returns a kilogram or more weight correctly", () => {
        expect(describeWeight(1.3)).toBe("1.3 kg");
    });
    it("displays value of 1 as 1kg rather than 1000g", () => {
        expect(describeWeight(1)).toBe("1.0 kg");
    });
});

const perch: CaughtFish = {
    id: "testfish",
    fishId: "perch",
    caughtAt: "2026-11-24T12:00:00.00Z",
    sessionId: "test-session",
    verified: true,
};
const shinyPerch: CaughtFish = { ...perch, isShiny: true };
const unknownFish: CaughtFish = { ...perch, fishId: "not a real fish" };
describe("getPrice", () => {
    it("price is 20 as its a common fish", () => {
        expect(getPrice(perch)).toBe(20);
    });
    it("price on a shiny perch is 100", () => {
        expect(getPrice(shinyPerch)).toBe(100);
    });
    it("if fish isnt in the roster return a price of 0", () => {
        expect(getPrice(unknownFish)).toBe(0);
    });
});

describe("marketGroupKey", () => {
    it("groups a normal fish by its species id", () => {
        expect(marketGroupKey(perch)).toBe("perch");
    });
    it("gives a shiny its own group so it isn't sold with the normal ones", () => {
        expect(marketGroupKey(shinyPerch)).toBe("perch:shiny");
    });
});