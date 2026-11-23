import { useState } from "react";
import { getFish } from "../game/fish";
import { describeSize, getPrice, type CaughtFish } from "../game/inventory";
import FishSprite from "./FishSprite";
import "./SessionReveal.css";

// The most face-down cards drawn in the pile. More catches than this still
// work; the pile just stops growing.
const MAX_PILE_LAYERS = 6;
// How far a shiny card leans toward the cursor, in degrees.
const MAX_TILT_DEGREES = 14;
// How many pixel sparkles burst out when a shiny is flipped.
const BURST_SPARKLES = 14;

type SessionRevealProps = {
  // This session's catches, in the order they were caught. Must not be empty:
  // App shows "Nothing bit this time" instead.
  catches: CaughtFish[];
};

// The end-of-session reveal: one big face-down card at a time. Tap to flip
// it, tap again to move on to the next one. Good catches (rare, legendary,
// shiny) glow or shake while still face-down, as a hint.
function SessionReveal({ catches }: SessionRevealProps) {
  // [1] Which catch the big card is showing, counting from 0.
  const [index, setIndex] = useState(0);
  // [2] Whether that card has been flipped face-up yet.
  const [flipped, setFlipped] = useState(false);
  // Whether a flipped holo card (shiny or legendary) has finished landing, so
  // it can follow the mouse without fighting the flip and slam animations.
  const [canTilt, setCanTilt] = useState(false);
  // Whether the cursor is currently tilting the holo card.
  const [tilting, setTilting] = useState(false);

  // [3] Worked out from the state above, not stored: once the index has gone
  // past the last catch, every card has been seen.
  const done = index >= catches.length;
  const current = catches[index];

  // [4] Tapping the big card: flip it if it's face-down, otherwise move on to
  // the next catch (which starts face-down).
  function tapCard() {
    if (!flipped) {
      setFlipped(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
      setCanTilt(false);
      setTilting(false);
    }
  }

  // The big slam is the last part of a holo card's flip (only shinies and
  // legendaries get it). Once it ends, the card is free to follow the mouse.
  // The target check ignores animations on the elements inside the card.
  function finishLanding(event: React.AnimationEvent<HTMLButtonElement>) {
    if (
      event.target === event.currentTarget &&
      event.animationName === "reveal-slam-big"
    ) {
      setCanTilt(true);
    }
  }

  // Passes the cursor position to the CSS, which tilts the card and moves the
  // foil and glare. Setting the variables directly avoids a React re-render
  // on every mouse movement.
  function tiltCard(event: React.PointerEvent<HTMLButtonElement>) {
    if (!canTilt) {
      return;
    }

    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    const style = event.currentTarget.style;
    style.setProperty("--holo-x", `${x * 100}%`);
    style.setProperty("--holo-y", `${y * 100}%`);
    style.setProperty("--tilt-x", `${(0.5 - y) * 2 * MAX_TILT_DEGREES}deg`);
    style.setProperty("--tilt-y", `${(x - 0.5) * 2 * MAX_TILT_DEGREES}deg`);
    setTilting(true);
  }

  // Clearing the variables lets the card settle back to facing forward.
  function stopTilt(event: React.PointerEvent<HTMLButtonElement>) {
    const style = event.currentTarget.style;
    style.removeProperty("--holo-x");
    style.removeProperty("--holo-y");
    style.removeProperty("--tilt-x");
    style.removeProperty("--tilt-y");
    setTilting(false);
  }

  // [5] Skip to the end. Jumping the index past the last catch makes `done`
  // true, so the summary shows.
  function revealAll() {
    setIndex(catches.length);
    setFlipped(false);
  }

  if (done) {
    const total = catches.reduce((sum, caught) => sum + getPrice(caught), 0);
    return (
      <div className="reveal-summary">
        <p className="reveal-summary-total">
          {catches.length} fish · worth {total} gold
        </p>
        <ul className="catch-list">
          {catches.map((caught) => (
            <CatchRow key={caught.id} caught={caught} />
          ))}
        </ul>
      </div>
    );
  }

  // [6] The cards already flipped, for the little row under the big card.
  const seen = catches.slice(0, flipped ? index + 1 : index);

  const fish = getFish(current.fishId);
  const rarity = fish?.rarity ?? "common";
  const cardClasses = [
    "reveal-card",
    `reveal-${rarity}`,
    current.isShiny ? "reveal-shiny" : "",
    current.isShiny || rarity === "legendary" ? "reveal-holo" : "",
    flipped ? "is-flipped" : "",
    tilting ? "is-tilting" : "",
  ].join(" ");

  // [7] How many face-down cards are still waiting under the top one. The
  // pile only draws a few, so a huge haul doesn't fill the screen.
  const underneath = catches.length - index - 1;
  const isLastCard = underneath === 0;
  const pileLayers = Math.min(underneath, MAX_PILE_LAYERS);

  // [8] Good fish get slammed down onto the pile when flipped, which makes
  // the cards underneath jolt. A legendary slams harder.
  const isLegendary = rarity === "legendary";
  const isGood = current.isShiny || rarity === "rare" || isLegendary;
  const stackClasses = [
    "reveal-stack",
    flipped && isGood ? "is-slammed" : "",
    isLegendary || current.isShiny ? "slam-big" : "",
  ].join(" ");

  return (
    <div className="reveal">
      <p className="reveal-count muted">
        {index + 1} of {catches.length}
      </p>

      <div className={stackClasses}>
        {/* The face-down cards still to come, drawn behind the top card. */}
        <span className="reveal-pile" aria-hidden="true">
          {/* Deepest card first, so each card is drawn over the one below. */}
          {Array.from({ length: pileLayers }, (_, i) => (
            <span
              key={i}
              className="reveal-pile-card"
              style={{ "--layer": pileLayers - i } as React.CSSProperties}
            />
          ))}
        </span>

        {/* The key gives each catch a fresh card, so a new card starts
            face-down instead of animating back from face-up. */}
        <button
          key={current.id}
          className={cardClasses}
          onClick={tapCard}
          onAnimationEnd={finishLanding}
          onPointerMove={tiltCard}
          onPointerLeave={stopTilt}
          aria-label={flipped ? `${fish?.name ?? "Unknown fish"}. ${isLastCard ? "Finish" : "Next card"}` : "Face-down card. Flip it"}
        >
          <span className="reveal-card-inner">
            <span className="reveal-face reveal-back" aria-hidden="true">
              <span className="reveal-back-mark">?</span>
            </span>
            <span className="reveal-face reveal-front">
              {fish && (
                <FishSprite fish={fish} size={112} shiny={current.isShiny} />
              )}
              <span className="reveal-name">{fish?.name ?? "Unknown fish"}</span>
              <span className="pill-row">
                <span className={`rarity rarity-${rarity}`}>{rarity}</span>
                {current.isShiny && (
                  <span className="rarity rarity-shiny">shiny</span>
                )}
              </span>
              <span className="fish-size">{describeSize(current)}</span>
            </span>
          </span>

          {/* The flash and sparkles when a shiny turns over. */}
          {current.isShiny && flipped && (
            <span className="reveal-burst" aria-hidden="true">
              {Array.from({ length: BURST_SPARKLES }, (_, i) => (
                <span
                  key={i}
                  style={
                    {
                      "--angle": `${(360 / BURST_SPARKLES) * i}deg`,
                      "--distance": `${130 + (i % 3) * 28}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>
          )}
        </button>

        {/* The golden shockwave as a legendary hits the pile. */}
        {isLegendary && flipped && (
          <span
            key={`${current.id}-shockwave`}
            className="reveal-shockwave"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
        )}
      </div>

      <p className="reveal-prompt muted">
        {flipped ? (isLastCard ? "Tap to finish" : "Tap for the next one") : "Tap to flip"}
      </p>

      {seen.length > 0 && (
        <ul className="reveal-seen" aria-label="Already revealed">
          {seen.map((caught) => {
            const seenFish = getFish(caught.fishId);
            return (
              <li key={caught.id} title={seenFish?.name}>
                {seenFish && (
                  <FishSprite fish={seenFish} size={28} shiny={caught.isShiny} />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button className="reveal-skip" onClick={revealAll}>
        Reveal all
      </button>
    </div>
  );
}

// One line of the summary list. The same layout the end screen used before
// the reveal existed.
function CatchRow({ caught }: { caught: CaughtFish }) {
  const fish = getFish(caught.fishId);
  return (
    <li className={caught.isShiny ? "shiny-row" : undefined}>
      <span className="fish-line">
        {fish && <FishSprite fish={fish} size={32} shiny={caught.isShiny} />}
        {fish ? fish.name : "Unknown fish"}
        <span className="fish-size">{describeSize(caught)}</span>
      </span>
      <span className="pill-row">
        {fish && (
          <span className={`rarity rarity-${fish.rarity}`}>{fish.rarity}</span>
        )}
        {caught.isShiny && <span className="rarity rarity-shiny">shiny</span>}
      </span>
    </li>
  );
}

export default SessionReveal;
