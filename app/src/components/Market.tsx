import { getPrice, type CaughtFish } from "../game/inventory";
import { FISH } from "../game/fish";
import FishSprite from "./FishSprite";
import { useState } from "react";
import "./Market.css";


type MarketProps = {
  inventory: CaughtFish[];
  // Called with species id -> how many of that species to sell.
  onSell: (selection: Record<string, number>) => void;
};

function Market({ inventory, onSell }: MarketProps) {
  // How many of each species the player has picked to sell (species id ->
  // quantity). A species that isn't in here counts as 0.
  const [selection, setSelection] = useState<Record<string, number>>({});
  // Whether the confirmation screen is showing.
  const [confirming, setConfirming] = useState(false);

  // Every species the player holds at least one of, with the price per fish.
  const species = FISH
    .map((fish) => ({
      fish,
      caught: inventory.filter((caught) => caught.fishId === fish.id),
    }))
    .filter(({ caught }) => caught.length > 0)
    .map(({ fish, caught }) => ({ fish, caught, price: getPrice(caught[0]) }));

  // Sets how many of one species to sell, kept between 0 and how many the
  // player holds.
  function setQuantity(fishId: string, quantity: number, held: number) {
    const clamped = Math.min(Math.max(quantity, 0), held);
    setSelection((previous) => ({ ...previous, [fishId]: clamped }));
  }

  // Every individual fish that would be sold, newest of each species first,
  // matching what sellFish in App removes.
  const toSell = species.flatMap(({ fish, caught }) => {
    const quantity = selection[fish.id] ?? 0;
    return caught
      .slice(caught.length - quantity)
      .reverse()
      .map((one) => ({ fish, caught: one, price: getPrice(one) }));
  });
  const total = toSell.reduce((sum, { price }) => sum + price, 0);
  const sellingRare = toSell.some(
    ({ fish }) => fish.rarity === "rare" || fish.rarity === "legendary",
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
        {species.map(({ fish, caught, price }) => {
          const held = caught.length;
          const selected = selection[fish.id] ?? 0;

          return (
            <div key={fish.id} className="panel market-card">
              <div className="market-card-top">
                <FishSprite fish={fish} size={48} />
                <h3>{fish.name}</h3>
                <span className={`rarity rarity-${fish.rarity}`}>
                  {fish.rarity}
                </span>
              </div>
              <div className="market-card-info">
                You hold {held} · {price} gold each
              </div>

              <div className="market-picker">
                <button
                  onClick={() => setQuantity(fish.id, selected - 1, held)}
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  max={held}
                  value={selected}
                  onChange={(event) =>
                    setQuantity(fish.id, Number(event.target.value) || 0, held)
                  }
                />
                <button
                  onClick={() => setQuantity(fish.id, selected + 1, held)}
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
                You're selling rare or legendary fish. They're hard to catch
                again.
              </div>
            )}

            <ul className="market-dialog-list">
              {toSell.map(({ fish, caught, price }) => (
                <li key={caught.id}>
                  <span className="fish-line">
                    <FishSprite fish={fish} size={28} />
                    {fish.name}{" "}
                    <span className={`rarity rarity-${fish.rarity}`}>
                      {fish.rarity}
                    </span>
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
