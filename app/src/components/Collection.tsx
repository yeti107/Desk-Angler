import { FISH } from "../game/fish";
import FishSprite from "./FishSprite";
import "./Collection.css";
import type { CaughtFish } from "../game/inventory";

type CollectionProps = {
  inventory: CaughtFish[];
  discoveries: string[];
};

function formatCaughtAt(caughtAt: string) {
  return new Date(caughtAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Collection({ inventory, discoveries }: CollectionProps) {
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
    <div className="collection">
      <h2>Collection</h2>
      <p className="muted">
        Discovered {discovered} of {FISH.length} species. {inventory.length} fish
        caught in total.
      </p>

      <div className="collection-list">
      {species.map(({ fish, caught }) =>
        !discoveries.includes(fish.id) ? (
          <div key={fish.id} className="panel collection-card undiscovered">
            <FishSprite fish={fish} size={64} silhouette />
            <h3>???</h3>
          </div>
        ) : (
          <div key={fish.id} className="panel collection-card">
            <FishSprite fish={fish} size={64} />
            <div className="collection-card-top">
              <h3>{fish.name}</h3>
              <span className={`rarity rarity-${fish.rarity}`}>
                {fish.rarity}
              </span>
            </div>
            <div className="muted">You hold {caught.length}</div>
            <ul className="collection-catches">
              {caught.map((one) => (
                <li key={one.id}>Caught {formatCaughtAt(one.caughtAt)}</li>
              ))}
            </ul>
          </div>
        ),
      )}
      </div>
    </div>
  );
}

export default Collection;
