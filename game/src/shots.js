// Sizzle & Serve — screenshot scenes: deterministic kitchen states for the
// entry's screenshots, driven by ?shot=start|play|end&seed=N. The scenes are
// built from the same state the live game uses, so the screenshots are real
// renders of the game's own code — never edited or composited.
import { DISHES } from './recipes.js';
import { mulberry32 } from './random.js';
import { newKitchen } from './kitchen.js';

// Build a frozen kitchen state for one named shot.
export function makeShotState(kind, seed) {
  const rng = mulberry32(seed || 1);
  const k = newKitchen();
  k.rng = rng;
  k.frozen = true;
  if (kind === 'start') {
    k.screen = 'start';
    return k;
  }
  if (kind === 'end') {
    k.screen = 'end';
    k.score = 1240;
    k.served = 11;
    k.mistakes = 2;
    k.bestCombo = 3;
    k.grade = 'A';
    k.timeLeft = 0;
    return k;
  }
  if (kind === 'rush') {
    // Final 30 seconds: rush hour is on, the board is full, a Double Trouble
    // is mid-assembly with both grill slots working.
    k.screen = 'play';
    k.elapsed = 98;
    k.timeLeft = 22;
    k.score = 980;
    k.combo = 3;
    k.bestCombo = 3;
    k.served = 9;
    k.rush = true;
    k.orders = [
      { id: 1, dish: DISHES[5], patience: 9, maxPatience: 22 },
      { id: 2, dish: DISHES[4], patience: 15, maxPatience: 26 },
      { id: 3, dish: DISHES[1], patience: 6, maxPatience: 20 },
    ];
    // Double Trouble mid-assembly: bun + one patty + cheese, second patty cooking.
    k.plate = ['bun', 'patty', 'cheese'];
    k.grill = [
      { state: 'cooking', t: 0.45, shake: 0 },
      { state: 'done', t: 1, shake: 0 },
    ];
    k.popups = [{ x: 640, y: 300, text: 'RUSH HOUR! +25 per serve', color: '#ff9d5c', t: 0.3, life: 1.4 }];
    return k;
  }
  // kind === 'play': mid-shift, a dish mid-assembly.
  k.screen = 'play';
  k.elapsed = 46;
  k.timeLeft = 74;
  k.score = 350;
  k.combo = 2;
  k.bestCombo = 2;
  k.served = 4;
  k.orders = [
    { id: 1, dish: DISHES[0], patience: 22, maxPatience: 30 },
    { id: 2, dish: DISHES[3], patience: 12, maxPatience: 28 },
    { id: 3, dish: DISHES[2], patience: 26, maxPatience: 32 },
  ];
  // A Classic Burger mid-assembly: bun + patty on the plate, lettuce still to add.
  k.plate = ['bun', 'patty'];
  // One patty sizzling, one golden and ready.
  k.grill = [
    { state: 'cooking', t: 0.6, shake: 0 },
    { state: 'done', t: 1, shake: 0 },
  ];
  k.popups = [{ x: 640, y: 300, text: '+200', color: '#ffd94d', t: 0.3, life: 1.4 }];
  return k;
}

export function shotFromUrl(url) {
  const params = new URLSearchParams(url.split('?')[1] ?? '');
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number(params.get('seed') ?? '1') || 1;
  return makeShotState(shot, seed);
}
