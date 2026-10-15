import { getPrice, type CaughtFish } from "../game/inventory";
import { FISH } from "../game/fish";



type MarketProps = {
  gold: number;
  inventory: CaughtFish[];
  onBack: () => void;
};

function Market({ gold, inventory, onBack }: MarketProps) {
  // Every species the player holds at least one of, with the price per fish.
  const species = FISH
    .map((fish) => ({
      fish,
      caught: inventory.filter((caught) => caught.fishId === fish.id),
    }))
    .filter(({ caught }) => caught.length > 0)
    .map(({ fish, caught }) => ({ fish, caught, price: getPrice(caught[0]) }));
  return (
    <div>
      <button onClick={onBack}>Back</button>

      <h2>Market</h2>
      <div>Gold: {gold}</div>
    </div>
  );
}

export default Market;
