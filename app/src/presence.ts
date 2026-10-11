// Decides whether the player counts as "at their desk", based on what the
// camera sees each second. The camera flickers (someone leans out of frame or
// turns around), so a change only counts once it has lasted a while.

const AWAY_AFTER_SECONDS = 20;
const BACK_AFTER_SECONDS = 3;

export type Presence = {
  isPresent: boolean;
  // How many seconds in a row the camera has disagreed with `isPresent`.
  disagreeSeconds: number;
};

export const INITIAL_PRESENCE: Presence = {
  isPresent: true,
  disagreeSeconds: 0,
};

// Called once a second with the latest camera reading.
export function updatePresence(
  presence: Presence,
  personVisible: boolean | null,
): Presence {
  // The camera is off, so there is nothing new to go on.
  if (personVisible === null) {
    return presence;
  }

  if (personVisible === presence.isPresent) {
    return { isPresent: presence.isPresent, disagreeSeconds: 0 };
  }

  const disagreeSeconds = presence.disagreeSeconds + 1;
  const secondsNeeded = presence.isPresent
    ? AWAY_AFTER_SECONDS
    : BACK_AFTER_SECONDS;

  if (disagreeSeconds >= secondsNeeded) {
    return { isPresent: personVisible, disagreeSeconds: 0 };
  }

  return { isPresent: presence.isPresent, disagreeSeconds };
}
