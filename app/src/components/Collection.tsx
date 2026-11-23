import { FISH } from "../game/fish";
import FishSprite from "./FishSprite";
import "./Collection.css";
import { describeSize, type CaughtFish } from "../game/inventory";

type CollectionProps = {
  inventory: CaughtFish[];
  discoveries: string[];
  // Species the player has ever caught a shiny of.
  shinyDiscoveries: string[];
};

function formatCaughtAt(caughtAt: string) {
  return new Date(caughtAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Collection({
  inventory,
  discoveries,
  shinyDiscoveries,
}: CollectionProps) {
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
      {species.map(({ fish, caught }) => {
        if (!discoveries.includes(fish.id)) {
          return (
            <div key={fish.id} className="panel collection-card undiscovered">
              <FishSprite fish={fish} size={64} silhouette />
              <h3>???</h3>
            </div>
          );
        }

        // Once a shiny of this species has ever been caught, the card turns
        // into a holo card and shows the shiny sprite (permanently, even if
        // the shiny has been sold).
        const shinyFound = shinyDiscoveries.includes(fish.id);
        // A legendary's holo card gets a gold frame on top of the rainbow.
        const legendaryShiny = shinyFound && fish.rarity === "legendary";
        return (
          <div
            key={fish.id}
            className={`panel collection-card${
              shinyFound ? " shiny-border shiny-card" : ""
            }${legendaryShiny ? " legendary-shiny" : ""}`}
          >
            {shinyFound && (
              <span className="shiny-sparkles" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
            )}
            <FishSprite fish={fish} size={64} shiny={shinyFound} />
            <div className="collection-card-top">
              <h3>{fish.name}</h3>
              <span className="pill-row">
                <span className={`rarity rarity-${fish.rarity}`}>
                  {fish.rarity}
                </span>
                {shinyFound && <span className="rarity rarity-shiny">shiny</span>}
              </span>
            </div>
            <div className="muted">You hold {caught.length}</div>
            <ul className="collection-catches">
              {caught.map((one) => (
                <li key={one.id}>
                  {one.isShiny && (
                    <span className="rarity rarity-shiny catch-shiny">shiny</span>
                  )}
                  {describeSize(one)} · caught {formatCaughtAt(one.caughtAt)}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      </div>
    </div>
  );
}

export default Collection;
