// Sizzle & Serve — the kitchen: all game state and the rules that change it.
// One file, one job: orders, the plate, the grill, the timer, the score and
// the combo. It knows nothing about drawing; render.js reads this state.
import {
  BOARD_H,
  BOARD_Y,
  COUNTER_H,
  COUNTER_Y,
  GRILL_SLOTS,
  MAX_COMBO,
  MAX_ORDERS,
  PATIENCE_EARLY,
  PATIENCE_LATE,
  SCORE_EXPIRED,
  SCORE_SERVE,
  SCORE_SPEED_BONUS,
  SCORE_WRONG,
  SHIFT_SECONDS,
  SPAWN_EARLY,
  SPAWN_LATE,
  TOP_BAR_H,
  VIEW_H,
  VIEW_W,
  WORKTOP_H,
  WORKTOP_Y,
  PATTY_COOK_SECONDS,
} from './config.js';
import { dishesAvailable, sameMultiset, INGREDIENTS } from './recipes.js';
import { mulberry32, pick } from './random.js';
import { playBuzz, playDing, playPop, playServe, playSizzle } from './audio.js';

// --- Layout: every clickable rectangle, in game coordinates. -------------
export function layout() {
  const bins = INGREDIENTS.map((ing, i) => ({
    id: ing.id,
    x: 30 + i * 176,
    y: COUNTER_Y + 14,
    w: 164,
    h: 164,
  }));
  return {
    topBar: { x: 0, y: 0, w: VIEW_W, h: TOP_BAR_H },
    orderSlots: [0, 1, 2].map((i) => ({
      x: 24 + i * 416,
      y: BOARD_Y,
      w: 400,
      h: BOARD_H,
    })),
    grillSlots: [0, 1].map((i) => ({
      x: 52 + i * 128,
      y: WORKTOP_Y + 66,
      w: 112,
      h: 112,
    })),
    grillArea: { x: 24, y: WORKTOP_Y, w: 276, h: WORKTOP_H },
    plateArea: { x: 340, y: WORKTOP_Y, w: 600, h: WORKTOP_H },
    serveBtn: { x: 980, y: WORKTOP_Y + 32, w: 276, h: 92 },
    trashBtn: { x: 980, y: WORKTOP_Y + 140, w: 276, h: 60 },
    bins,
    counter: { x: 0, y: COUNTER_Y, w: VIEW_W, h: COUNTER_H },
    screen: { x: 0, y: 0, w: VIEW_W, h: VIEW_H },
  };
}

export function newKitchen() {
  return {
    screen: 'start',
    rng: mulberry32(20261125),
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    mistakes: 0,
    orders: [],
    plate: [],
    grill: Array.from({ length: GRILL_SLOTS }, () => ({ state: 'empty', t: 0, shake: 0 })),
    spawnTimer: 8,
    popups: [],
    flash: null,
    frozen: false,
    rush: false,
    grade: null,
    muted: false,
    nextOrderId: 1,
  };
}

function progressOf(k) {
  return Math.min(1, k.elapsed / SHIFT_SECONDS);
}

function patienceFor(k) {
  return PATIENCE_EARLY + (PATIENCE_LATE - PATIENCE_EARLY) * progressOf(k);
}

function spawnIntervalFor(k) {
  return SPAWN_EARLY + (SPAWN_LATE - SPAWN_EARLY) * progressOf(k);
}

function addPopup(k, x, y, text, color) {
  k.popups.push({ x, y, text, color, t: 0, life: 1.4 });
}

export function startShift(k) {
  const fresh = newKitchen();
  fresh.rng = k.rng;
  Object.assign(k, fresh, { screen: 'play' });
  spawnOrder(k);
  spawnOrder(k);
}

export function spawnOrder(k) {
  if (k.orders.length >= MAX_ORDERS) return;
  const dish = pick(k.rng, dishesAvailable(k.elapsed));
  const patience = patienceFor(k);
  k.orders.push({ id: k.nextOrderId++, dish, patience, maxPatience: patience });
}

export function addIngredient(k, id) {
  if (k.screen !== 'play' || k.frozen) return;
  if (id === 'patty') {
    const slot = k.grill.find((s) => s.state === 'empty');
    if (!slot) {
      addPopup(k, 162, WORKTOP_Y + 40, 'Grill is full!', '#ff8a7a');
      return;
    }
    slot.state = 'cooking';
    slot.t = 0;
    playSizzle();
    return;
  }
  if (k.plate.length >= 6) {
    addPopup(k, 640, WORKTOP_Y + 30, 'Plate full — serve it or trash it!', '#ff8a7a');
    return;
  }
  k.plate.push(id);
  playPop();
}

export function takeGrill(k, slotIndex) {
  if (k.screen !== 'play' || k.frozen) return;
  const slot = k.grill[slotIndex];
  if (!slot) return;
  if (slot.state === 'done') {
    if (k.plate.length >= 6) {
      addPopup(k, 640, WORKTOP_Y + 30, 'Plate full — serve it or trash it!', '#ff8a7a');
      return;
    }
    slot.state = 'empty';
    slot.t = 0;
    k.plate.push('patty');
    playPop();
  } else if (slot.state === 'cooking') {
    slot.shake = 0.25;
  }
}

export function servePlate(k) {
  if (k.screen !== 'play' || k.frozen) return;
  if (k.plate.length === 0) return;
  const matchIndex = k.orders.findIndex((o) => sameMultiset(k.plate, o.dish.needs));
  const plateCenter = { x: 640, y: WORKTOP_Y + 120 };
  if (matchIndex >= 0) {
    const order = k.orders[matchIndex];
    k.combo = Math.min(k.combo + 1, MAX_COMBO);
    k.bestCombo = Math.max(k.bestCombo, k.combo);
    const speedBonus = Math.round(SCORE_SPEED_BONUS * (order.patience / order.maxPatience));
    // Rush hour (last 30s): every clean serve pays +25 on top.
    const rushBonus = k.rush ? 25 : 0;
    const points = (SCORE_SERVE + speedBonus + rushBonus) * k.combo;
    k.score += points;
    k.served += 1;
    k.orders.splice(matchIndex, 1);
    k.plate = [];
    addPopup(k, plateCenter.x, plateCenter.y, `+${points}`, '#ffd94d');
    if (k.combo > 1) addPopup(k, plateCenter.x, plateCenter.y + 30, `COMBO x${k.combo}!`, '#ff9d5c');
    playServe(k.combo);
  } else {
    k.score += SCORE_WRONG;
    k.combo = 0;
    k.mistakes += 1;
    k.plate = [];
    k.flash = { color: '#d94f3d', t: 0.45 };
    addPopup(k, plateCenter.x, plateCenter.y, 'Wrong order! -25', '#ff8a7a');
    playBuzz();
  }
}

export function trashPlate(k) {
  if (k.screen !== 'play' || k.frozen) return;
  if (k.plate.length === 0) return;
  k.plate = [];
  playPop();
}

function endShift(k) {
  k.screen = 'end';
  k.timeLeft = 0;
  k.grade = k.served >= 14 ? 'S' : k.served >= 10 ? 'A' : k.served >= 7 ? 'B' : 'C';
}

export function updateKitchen(k, dt) {
  // Frozen (screenshot) scenes never advance: the frame is the picture.
  if (k.frozen) return;
  if (k.screen !== 'play') {
    for (const p of k.popups) p.t += dt;
    k.popups = k.popups.filter((p) => p.t < p.life);
    if (k.flash) {
      k.flash.t -= dt;
      if (k.flash.t <= 0) k.flash = null;
    }
    return;
  }
  k.elapsed += dt;
  k.timeLeft = Math.max(0, SHIFT_SECONDS - k.elapsed);
  if (k.timeLeft <= 0) {
    endShift(k);
    return;
  }
  // Rush hour: the last 30 seconds. Orders arrive faster and every clean
  // serve pays +25 — the shift ends on a sprint, not a wind-down.
  if (!k.rush && k.timeLeft <= 30) {
    k.rush = true;
    addPopup(k, 640, BOARD_Y + 40, 'RUSH HOUR! +25 per serve', '#ff9d5c');
    playDing();
  }
  k.spawnTimer -= dt;
  if (k.spawnTimer <= 0) {
    spawnOrder(k);
    k.spawnTimer = k.rush ? 5 : spawnIntervalFor(k);
  }
  for (let i = k.orders.length - 1; i >= 0; i--) {
    const order = k.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      k.orders.splice(i, 1);
      k.score += SCORE_EXPIRED;
      k.combo = 0;
      k.mistakes += 1;
      k.flash = { color: '#d94f3d', t: 0.45 };
      addPopup(k, 640, BOARD_Y + 40, 'Walked out! -50', '#ff8a7a');
      playBuzz();
    }
  }
  for (const slot of k.grill) {
    if (slot.state === 'cooking') {
      slot.t += dt / PATTY_COOK_SECONDS;
      if (slot.t >= 1) {
        slot.t = 1;
        slot.state = 'done';
        playDing();
      }
    }
    if (slot.shake > 0) slot.shake -= dt;
  }
  for (const p of k.popups) p.t += dt;
  k.popups = k.popups.filter((p) => p.t < p.life);
  if (k.flash) {
    k.flash.t -= dt;
    if (k.flash.t <= 0) k.flash = null;
  }
}
