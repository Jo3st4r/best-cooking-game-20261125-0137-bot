// Sizzle & Serve — bootstrap: the game loop, the screen state machine and
// the wiring from pointer/keyboard input to kitchen actions. One file, one
// job: start the canvas, run the loop, route input.
import { VIEW_H, VIEW_W } from './config.js';
import {
  addIngredient,
  layout,
  newKitchen,
  servePlate,
  startShift,
  takeGrill,
  trashPlate,
  updateKitchen,
} from './kitchen.js';
import { drawScene } from './render.js';
import { shotFromUrl } from './shots.js';
import { attachInput, inside } from './input.js';
import { INGREDIENTS } from './recipes.js';
import { ensureAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

let kitchen = newKitchen();
let scale = 1;
let offsetX = 0;
let offsetY = 0;

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
  offsetX = (canvas.width - VIEW_W * scale) / 2;
  offsetY = (canvas.height - VIEW_H * scale) / 2;
}

function toGame(clientX, clientY) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const px = clientX * dpr;
  const py = clientY * dpr;
  const gx = (px - offsetX) / scale;
  const gy = (py - offsetY) / scale;
  if (gx < 0 || gy < 0 || gx > VIEW_W || gy > VIEW_H) return null;
  return { x: gx, y: gy };
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function handleTap(x, y) {
  ensureAudio();
  const L = layout();
  if (kitchen.screen === 'start') {
    startShift(kitchen);
    announce('Shift started. First orders are on the board.');
    return;
  }
  if (kitchen.screen === 'end') {
    startShift(kitchen);
    announce('New shift started.');
    return;
  }
  for (let i = 0; i < L.bins.length; i++) {
    if (inside(x, y, L.bins[i])) {
      addIngredient(kitchen, INGREDIENTS[i].id);
      return;
    }
  }
  for (let i = 0; i < L.grillSlots.length; i++) {
    if (inside(x, y, L.grillSlots[i])) {
      takeGrill(kitchen, i);
      return;
    }
  }
  if (inside(x, y, L.serveBtn)) {
    servePlate(kitchen);
    return;
  }
  if (inside(x, y, L.trashBtn)) {
    trashPlate(kitchen);
  }
}

function handleKey(key) {
  ensureAudio();
  if (key === 'm') {
    kitchen.muted = toggleMute();
    return;
  }
  if (kitchen.screen === 'start' && (key === 'enter' || key === ' ')) {
    startShift(kitchen);
    announce('Shift started. First orders are on the board.');
    return;
  }
  if (kitchen.screen === 'end' && key === 'enter') {
    startShift(kitchen);
    announce('New shift started.');
    return;
  }
  if (kitchen.screen !== 'play') return;
  const ing = INGREDIENTS.find((g) => g.key === key);
  if (ing) {
    addIngredient(kitchen, ing.id);
    return;
  }
  if (key === ' ' || key === 'enter') servePlate(kitchen);
  else if (key === 't') trashPlate(kitchen);
  else if (key === 'g') {
    const done = kitchen.grill.findIndex((s) => s.state === 'done');
    if (done >= 0) takeGrill(kitchen, done);
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last ?? now)) / 1000);
  frame.last = now;
  updateKitchen(kitchen, dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#2b1a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  drawScene(ctx, kitchen);
  requestAnimationFrame(frame);
}

function boot() {
  resize();
  window.addEventListener('resize', resize);
  const shot = shotFromUrl(window.location.href);
  if (shot) {
    kitchen = shot;
  } else {
    attachInput(canvas, { toGame, onTap: handleTap, onKey: handleKey });
  }
  requestAnimationFrame(frame);
}

boot();
