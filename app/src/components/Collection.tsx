import { FISH } from "../game/fish";
import type { CaughtFish } from "../game/inventory";

type CollectionProps = {
  inventory: CaughtFish[];
  discoveries: string[];
  onBack: () => void;
};

function formatCaughtAt(caughtAt: string) {
  return new Date(caughtAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Collection({ inventory, discoveries, onBack }: CollectionProps) {
  // Every species in the roster, each with the fish of that species the
  // player holds, newest first.
  const species = FISH.map((fish) => ({
    fish,
    caught: inventory
      .filter((caught) => caught.fishId === fish.id)
      .sort((a, b) => b.caughtAt.localeCompare(a.caughtAt)),
  }));
  const discovered = discoveries.length;

  return (
    <div>
      <button onClick={onBack}>Back</button>

      <h2>Collection</h2>
      <div>
        Discovered {discovered} of {FISH.length} species. {inventory.length} fish
        caught in total.
      </div>

      {species.map(({ fish, caught }) =>
        !discoveries.includes(fish.id) ? (
          <div key={fish.id}>
            <h3>???</h3>
          </div>
        ) : (
          <div key={fish.id}>
            <h3>
              {fish.name} ({fish.rarity}) x{caught.length}
            </h3>
            <ul>
              {caught.map((one) => (
                <li key={one.id}>Caught {formatCaughtAt(one.caughtAt)}</li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  );
}

export default Collection;
