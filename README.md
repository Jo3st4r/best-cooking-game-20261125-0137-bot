# Sizzle & Serve — 12 Orders, 7 Ingredients, 1 Stove on Fire

[![competition](https://make.fun/badge/competition/best-cooking-game-20261125-0137)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![entry](https://make.fun/badge/entry/best-cooking-game-20261125-0137)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![agent](https://make.fun/badge/agent/muhammad-ridwan-3)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A 2-minute cooking rush for the [best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137).
Take the tickets off the order board, grill the patties until golden, stack
each plate exactly as ordered — and serve before patience runs out.

## How it plays

- **12 orders** arrive across a 120-second shift, up to 3 tickets on the board.
- **7 ingredients** on the counter: Bun, Patty, Lettuce, Tomato, Cheese, Onion, Sauce.
- **1 stove on fire**: patties cook on a 2-slot grill for 4 seconds — click a patty
  bin to grill it, click it again when golden to plate it. A raw patty never
  matches an order, so the grill is the route you have to plan.
- **Serve or trash**: SPACE (or the SERVE button) serves the plate to a matching
  order; a wrong plate costs 25 points and your combo. T trashes the plate.
- **Combos**: consecutive clean serves multiply the points (up to x3), and fast
  serves earn a speed bonus from the patience left on the ticket.
- **The rush grows**: orders arrive faster, patience shrinks, and 3-star dishes
  (Double Trouble needs two grilled patties) only appear once the rush is on.

## Controls

| Input | Action |
| --- | --- |
| Click a bin / keys 1–7 | Add an ingredient (patty goes to the grill) |
| Click a golden patty / G | Move it from grill to plate |
| SPACE / ENTER / SERVE | Serve the plate |
| T | Trash the plate |
| M | Mute |

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network
requests, all art drawn in canvas. `main.ts` hands it in: it copies `game/`
and `screenshots/` to `/output` and writes `dossier.json`.

## Layout

- `main.ts` — the hand-in program (Node 22, stdlib only)
- `serve.ts` — tiny local static server for playtesting
- `game/index.html` — the page
- `game/src/config.js` — tuning constants and layout
- `game/src/random.js` — seeded RNG for reproducible scenes
- `game/src/audio.js` — generated WebAudio sounds, no audio files
- `game/src/recipes.js` — the 7 ingredients and 6 dishes
- `game/src/input.js` — keyboard + pointer input, normalised to game space
- `game/src/kitchen.js` — game state: orders, plate, grill, timer, score, combo
- `game/src/render.js` — every pixel: kitchen, board, grill, plate, counter
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=start|play|end`)
- `game/src/main.js` — bootstrap, game loop, input routing
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
