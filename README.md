# Desk Angler

**A cosy fishing companion for your hardest focus sessions.**

Stay focused and your fisherman reels in fish to collect and sell. Get distracted and the lake goes quiet.

## What it does

- Start a focus session and your fisherman casts his line
- The **camera** checks you're at your desk. Step away for about 20 seconds and he pauses
- Opening an app on your **distraction list** pauses him too
- While you're focused, fish bite every few minutes. Each catch has a **rarity** (common, uncommon, rare or legendary), and the full reveal comes when the session ends
- Discovered species fill up your **Collection**
- Sell fish at the **Market** for gold
- A small **floating widget** keeps the fisherman on screen while you work in other apps
- Light and dark themes that follow macOS

### Planned

- Fisherman customisation, bought with gold
- Fish that only bite at certain times of day or in certain weather
- Session-end summary screen
- Bait and lures that nudge the rarity odds
- Fish sizes and weights, with personal bests
- Achievements
- Session history
- Later: fish trading between players

## Tech stack

- **Tauri 2** (Rust)
- **React 19** + **TypeScript**
- **Apple Vision framework**, called from Rust via `objc2`
- **Vite**

## Technical highlights

### Game systems

- Catch rarity is a **weighted random roll** (70 / 20 / 8 / 2 % across the four rarities), then a weighted pick of a species within that rarity
- The gap between bites is a random amount of focused time, so catches feel natural rather than clockwork
- Every caught fish is stored as its **own record** (id, species, time caught, session, and whether the camera verified that session) instead of a simple count per species, so individual fish can later get sizes, be traded, or be verified by a server
- The Market groups fish by species, lets you pick a quantity of each, confirms the sale with a warning for rare and legendary fish, and sells the newest fish first

### On-device presence detection

- The Rust side reads the webcam through AVFoundation and runs Apple's Vision framework (face and body detection) on the frames
- **No image ever leaves the app.** Frames are analysed in memory and thrown away, and the only thing passed to the rest of the app is a yes/no: is someone at the desk
- Presence is smoothed so a glance away doesn't count: the fisherman pauses after about 20 seconds away and resumes after 3 seconds back

### Distraction list

- Instead of trying to detect "work", the app watches which app is in front and pauses if it is on a list the user chooses
- A deliberately simple first version: what counts as a distraction differs from person to person, so the user decides. Distracting websites are a planned next step

## Project structure

```
app/
├── src/                  React + TypeScript front end
│   ├── components/       Screens and UI (fisherman scene, collection, market, settings, widget)
│   ├── game/             Game logic: fish roster, catch rolls, inventory, gold, discoveries
│   ├── presence.ts       Smooths the camera's yes/no into "at desk" / "away"
│   ├── detection.ts      Talks to the Rust side for camera and app checks
│   └── storage.ts        The one place that reads and writes saved data
└── src-tauri/src/        Rust (native macOS)
    ├── camera.rs         Webcam capture + Apple Vision person detection
    ├── apps.rs           Which app is in front, and which are running
    ├── widget.rs         Floating widget window
    └── lib.rs            App setup and the session clock
```

## Status

Early development. Version **0.0.1** is a first test build shared with friends.

- macOS on Apple Silicon only
- Builds are not yet signed with an Apple Developer account
- Fish art and the species list are placeholders
- Save data is stored locally and will be reset before a full release

## Running locally

Requires macOS, [Node.js](https://nodejs.org/) and [Rust](https://www.rust-lang.org/tools/install) (see the [Tauri prerequisites](https://tauri.app/start/prerequisites/)).

```bash
cd app
npm install
npm run tauri dev
```

The app asks for camera permission on first launch.

## License

© Munaan Razwan. All rights reserved. The source is public to read, but it may not be copied, modified or redistributed without permission.
