import {
  describeSize,
  getPrice,
  marketGroupKey,
  type CaughtFish,
} from "../game/inventory";
import { FISH } from "../game/fish";
import FishSprite from "./FishSprite";
import { useState } from "react";
import "./Market.css";


type MarketProps = {
  inventory: CaughtFish[];
  // Called with Market card (see marketGroupKey) -> how many to sell from it.
  onSell: (selection: Record<string, number>) => void;
};

function Market({ inventory, onSell }: MarketProps) {
  // How many from each card the player has picked to sell (card key ->
  // quantity). A card that isn't in here counts as 0. A card is a species, or
  // that species' shinies (see marketGroupKey).
  const [selection, setSelection] = useState<Record<string, number>>({});
  // Whether the confirmation screen is showing.
  const [confirming, setConfirming] = useState(false);

  // One card per species the player holds, plus a separate card for that
  // species' shinies if they hold any. Each card has its price per fish.
  const species = FISH.flatMap((fish) => {
    const ofSpecies = inventory.filter((caught) => caught.fishId === fish.id);
    const normal = ofSpecies.filter((caught) => !caught.isShiny);
    const shinies = ofSpecies.filter((caught) => caught.isShiny);
    return [normal, shinies]
      .filter((caught) => caught.length > 0)
      .map((caught) => ({
        fish,
        caught,
        key: marketGroupKey(caught[0]),
        shiny: caught[0].isShiny === true,
        price: getPrice(caught[0]),
      }));
  });

  // Sets how many to sell from one card, kept between 0 and how many the
  // player holds.
  function setQuantity(key: string, quantity: number, held: number) {
    const clamped = Math.min(Math.max(quantity, 0), held);
    setSelection((previous) => ({ ...previous, [key]: clamped }));
  }

  // Every individual fish that would be sold, newest of each card first,
  // matching what sellFish in App removes.
  const toSell = species.flatMap(({ fish, caught, key }) => {
    const quantity = selection[key] ?? 0;
    return caught
      .slice(caught.length - quantity)
      .reverse()
      .map((one) => ({ fish, caught: one, price: getPrice(one) }));
  });
  const total = toSell.reduce((sum, { price }) => sum + price, 0);
  const sellingRare = toSell.some(
    ({ fish, caught }) =>
      fish.rarity === "rare" || fish.rarity === "legendary" || caught.isShiny,
  );

  function confirmSale() {
    onSell(selection);
    setSelection({});
    setConfirming(false);
  }

  return (
    <div className="market">
      <h2>Market</h2>

      {species.length === 0 && (
        <p className="muted">You have no fish to sell. Go catch some!</p>
      )}

      <div className="market-list">
        {species.map(({ fish, caught, key, shiny, price }) => {
          const held = caught.length;
          const selected = selection[key] ?? 0;

          return (
            <div
              key={key}
              className={`panel market-card${shiny ? " shiny-border" : ""}`}
            >
              <div className="market-card-top">
                <FishSprite fish={fish} size={48} shiny={shiny} />
                <h3>{fish.name}</h3>
                <span className={`rarity rarity-${fish.rarity}`}>
                  {fish.rarity}
                </span>
                {shiny && <span className="rarity rarity-shiny">shiny</span>}
              </div>
              <div className="market-card-info">
                You hold {held} · {price} gold each
              </div>

              {/* Every fish of this species, newest first (the same order
                  they get sold in). */}
              <ul className="market-card-fish">
                {[...caught].reverse().map((one) => (
                  <li key={one.id}>{describeSize(one)}</li>
                ))}
              </ul>

              <div className="market-picker">
                <button
                  onClick={() => setQuantity(key, selected - 1, held)}
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  max={held}
                  value={selected}
                  onChange={(event) =>
                    setQuantity(key, Number(event.target.value) || 0, held)
                  }
                />
                <button
                  onClick={() => setQuantity(key, selected + 1, held)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {species.length > 0 && (
        <button
          className="primary market-sell"
          disabled={toSell.length === 0}
          onClick={() => setConfirming(true)}
        >
          Sell {toSell.length} for {total} gold
        </button>
      )}

      {confirming && (
        <div className="market-overlay">
          <div className="panel market-dialog" role="dialog" aria-modal="true">
            <h2>Sell these fish?</h2>

            {sellingRare && (
              <div className="alert" role="alert">
                You're selling rare, legendary or shiny fish. They're hard to
                catch again.
              </div>
            )}

            <ul className="market-dialog-list">
              {toSell.map(({ fish, caught, price }) => (
                <li key={caught.id}>
                  <span className="fish-line">
                    <FishSprite fish={fish} size={28} shiny={caught.isShiny} />
                    {fish.name}{" "}
                    <span className={`rarity rarity-${fish.rarity}`}>
                      {fish.rarity}
                    </span>
                    {caught.isShiny && (
                      <span className="rarity rarity-shiny">shiny</span>
                    )}
                    <span className="fish-size">{describeSize(caught)}</span>
                  </span>
                  <span>{price} gold</span>
                </li>
              ))}
            </ul>
            <div className="market-total">Total: {total} gold</div>

            <div className="market-dialog-buttons">
              <button onClick={() => setConfirming(false)}>Cancel</button>
              <button className="primary" onClick={confirmSale}>
                Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Market;
