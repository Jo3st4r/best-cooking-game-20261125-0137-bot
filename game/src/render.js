// Sizzle & Serve — the renderer: every pixel the game shows, drawn on canvas.
// One file, one job: turn kitchen state into a kitchen you can read at a
// glance. All food art is drawn here with canvas paths — original art, no
// images, no network.
import {
  BOARD_H,
  BOARD_Y,
  COLORS,
  COUNTER_Y,
  SHIFT_SECONDS,
  TOP_BAR_H,
  VIEW_H,
  VIEW_W,
  WORKTOP_Y,
} from './config.js';
import { layout } from './kitchen.js';
import { INGREDIENTS, INGREDIENT_BY_ID } from './recipes.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Ingredient icons, drawn with canvas paths. --------------------------
export function drawIngredient(ctx, id, cx, cy, s) {
  const u = s / 100;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun') {
    ctx.fillStyle = '#e8a93c';
    ctx.beginPath();
    ctx.ellipse(0, -6 * u, 42 * u, 26 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-22, -22], [0, -28], [22, -22], [-11, -14], [11, -14]]) {
      ctx.beginPath();
      ctx.ellipse(sx * u, sy * u, 4 * u, 2.5 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#c98a2b';
    rr(ctx, -42 * u, 6 * u, 84 * u, 14 * u, 7 * u);
    ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = '#7a4a2b';
    rr(ctx, -42 * u, -14 * u, 84 * u, 28 * u, 12 * u);
    ctx.fill();
    ctx.strokeStyle = '#5e3820';
    ctx.lineWidth = 4 * u;
    for (const dx of [-24, 0, 24]) {
      ctx.beginPath();
      ctx.moveTo(dx * u, -12 * u);
      ctx.lineTo(dx * u, 12 * u);
      ctx.stroke();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#6fbf4a';
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const x = -44 * u + (88 * u * i) / 8;
      const y = (i % 2 === 0 ? -12 : 12) * u;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(44 * u, 22 * u);
    ctx.lineTo(-44 * u, 22 * u);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#4e9a33';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(-40 * u, 0);
    ctx.lineTo(40 * u, 0);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e0523e';
    ctx.beginPath();
    ctx.arc(0, 0, 34 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2826f';
    ctx.beginPath();
    ctx.arc(-10 * u, -10 * u, 10 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5da24a';
    ctx.beginPath();
    ctx.moveTo(0, -34 * u);
    ctx.lineTo(-8 * u, -44 * u);
    ctx.lineTo(8 * u, -44 * u);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.moveTo(-42 * u, 18 * u);
    ctx.lineTo(42 * u, 18 * u);
    ctx.lineTo(0, -26 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a52e';
    for (const [hx, hy] of [[-12, 6], [12, 6], [0, -8]]) {
      ctx.beginPath();
      ctx.arc(hx * u, hy * u, 4 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'onion') {
    ctx.strokeStyle = '#efe6f2';
    ctx.lineWidth = 7 * u;
    for (const r of [32, 22, 12]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#c9b8d4';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.arc(0, 0, 32 * u, 0, Math.PI * 2);
    ctx.stroke();
  } else if (id === 'sauce') {
    ctx.fillStyle = '#f07f3c';
    ctx.beginPath();
    ctx.moveTo(-40 * u, -6 * u);
    ctx.bezierCurveTo(-20 * u, -26 * u, 20 * u, 14 * u, 40 * u, -6 * u);
    ctx.bezierCurveTo(20 * u, 6 * u, -20 * u, -14 * u, -40 * u, -6 * u);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(28 * u, 12 * u, 6 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-26 * u, 14 * u, 4 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --- Scene pieces. ---------------------------------------------------------
function drawTopBar(ctx, k) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, VIEW_W, TOP_BAR_H);
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(0, TOP_BAR_H - 4, VIEW_W, 4);
  text(ctx, '🍳 SIZZLE & SERVE', 24, TOP_BAR_H / 2, 30, COLORS.cream, 'bold', 'left');
  const mm = String(Math.floor(k.timeLeft / 60));
  const ss = String(Math.floor(k.timeLeft % 60)).padStart(2, '0');
  const urgent = k.screen === 'play' && k.timeLeft <= 20;
  text(ctx, `${mm}:${ss}`, VIEW_W / 2, TOP_BAR_H / 2 + 1, 34, urgent ? '#ff6b5e' : COLORS.cream);
  if (k.rush && k.screen === 'play') {
    text(ctx, 'RUSH HOUR!', VIEW_W / 2 + 110, TOP_BAR_H / 2 + 1, 20, '#ff9d5c', 'bold', 'left');
  }
  text(ctx, `SCORE ${k.score}`, VIEW_W - 220, TOP_BAR_H / 2 - 12, 22, COLORS.cream, 'bold', 'right');
  if (k.combo > 1) {
    text(ctx, `COMBO x${k.combo}`, VIEW_W - 220, TOP_BAR_H / 2 + 14, 18, '#ff9d5c', 'bold', 'right');
  } else {
    text(ctx, k.muted ? 'MUTED (M)' : 'M: MUTE', VIEW_W - 220, TOP_BAR_H / 2 + 14, 14, '#b9a68f', 'normal', 'right');
  }
}

function drawBoard(ctx, k) {
  const L = layout();
  for (let i = 0; i < 3; i++) {
    const slot = L.orderSlots[i];
    const order = k.orders[i];
    ctx.fillStyle = order ? COLORS.panel : '#5a3a28';
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 12);
    ctx.fill();
    ctx.strokeStyle = order ? COLORS.panelEdge : '#7a5238';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!order) {
      text(ctx, '— waiting for the next order —', slot.x + slot.w / 2, slot.y + slot.h / 2, 17, '#a98a68', 'normal');
      continue;
    }
    text(ctx, order.dish.name, slot.x + 16, slot.y + 26, 24, COLORS.ink, 'bold', 'left');
    const stars = '★'.repeat(order.dish.stars) + '☆'.repeat(3 - order.dish.stars);
    text(ctx, stars, slot.x + slot.w - 16, slot.y + 26, 18, '#d9a52e', 'bold', 'right');
    // Needed ingredients, in recipe order.
    let ix = slot.x + 44;
    for (const id of order.dish.needs) {
      drawIngredient(ctx, id, ix, slot.y + 72, 46);
      ix += 56;
    }
    // Patience bar.
    const frac = Math.max(0, order.patience / order.maxPatience);
    const bx = slot.x + 16;
    const bw = slot.w - 32;
    ctx.fillStyle = '#e8dcc8';
    rr(ctx, bx, slot.y + slot.h - 18, bw, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? COLORS.green : frac > 0.25 ? '#e8a93c' : COLORS.red;
    if (bw * frac > 10) {
      rr(ctx, bx, slot.y + slot.h - 18, bw * frac, 10, 5);
      ctx.fill();
    }
  }
}

function drawGrill(ctx, k) {
  const L = layout();
  const area = L.grillArea;
  ctx.fillStyle = '#3d3d46';
  rr(ctx, area.x, area.y, area.w, area.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#55555f';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'GRILL', area.x + area.w / 2, area.y + 26, 20, '#f2f2f2');
  text(ctx, 'patty cooks 4s — click when golden', area.x + area.w / 2, area.y + 48, 12, '#b9b9c4', 'normal');
  for (let i = 0; i < 2; i++) {
    const slot = L.grillSlots[i];
    const g = k.grill[i];
    const shakeX = g.shake > 0 ? Math.sin(g.shake * 60) * 3 : 0;
    ctx.fillStyle = '#26262e';
    rr(ctx, slot.x + shakeX, slot.y, slot.w, slot.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#6a6a75';
    ctx.stroke();
    if (g.state === 'cooking') {
      drawIngredient(ctx, 'patty', slot.x + slot.w / 2 + shakeX, slot.y + slot.h / 2, 64);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      rr(ctx, slot.x + 8, slot.y + slot.h - 20, slot.w - 16, 12, 6);
      ctx.fill();
      ctx.fillStyle = '#ffb347';
      rr(ctx, slot.x + 8, slot.y + slot.h - 20, (slot.w - 16) * g.t, 12, 6);
      ctx.fill();
    } else if (g.state === 'done') {
      const pulse = 1 + Math.sin(Date.now() / 180) * 0.04;
      ctx.save();
      ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
      ctx.scale(pulse, pulse);
      ctx.translate(-(slot.x + slot.w / 2), -(slot.y + slot.h / 2));
      drawIngredient(ctx, 'patty', slot.x + slot.w / 2, slot.y + slot.h / 2, 64);
      ctx.restore();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.arc(slot.x + slot.w - 12, slot.y + 12, 14, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '!', slot.x + slot.w - 12, slot.y + 13, 20, COLORS.ink);
      text(ctx, 'READY — click it!', slot.x + slot.w / 2, slot.y + slot.h - 26, 13, '#ffd94d');
    } else {
      ctx.strokeStyle = '#55555f';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      rr(ctx, slot.x + 10, slot.y + 10, slot.w - 20, slot.h - 20, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'empty', slot.x + slot.w / 2, slot.y + slot.h / 2, 15, '#77777f', 'normal');
    }
  }
}

function drawPlate(ctx, k) {
  const L = layout();
  const area = L.plateArea;
  ctx.fillStyle = COLORS.wood;
  rr(ctx, area.x, area.y, area.w, area.h, 12);
  ctx.fill();
  ctx.strokeStyle = COLORS.woodDark;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'YOUR PLATE — stack it, then SERVE', area.x + area.w / 2, area.y + 26, 19, COLORS.cream);
  // The plate itself.
  const cx = area.x + area.w / 2;
  const cy = area.y + 158;
  ctx.fillStyle = '#f7f3ea';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 210, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9c9a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 178, 48, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Stacked ingredients, bottom-up in the order they were added, fanned
  // slightly so every layer shows — a dish mid-assembly reads at a glance.
  const n = k.plate.length;
  k.plate.forEach((id, i) => {
    const x = cx + (i % 2 === 0 ? -16 : 16);
    drawIngredient(ctx, id, x, cy - 8 - i * 18, 88);
  });
  if (n === 0) {
    text(ctx, 'empty plate — tap ingredients below', cx, cy - 2, 17, '#a98a68', 'normal');
  }
  // Serve + trash buttons.
  const serve = L.serveBtn;
  const trash = L.trashBtn;
  ctx.fillStyle = k.plate.length > 0 ? COLORS.green : '#7a8a6a';
  rr(ctx, serve.x, serve.y, serve.w, serve.h, 14);
  ctx.fill();
  ctx.strokeStyle = '#3f6b32';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'SERVE  ⏎', serve.x + serve.w / 2, serve.y + serve.h / 2 - 12, 30, '#ffffff');
  text(ctx, 'space works too', serve.x + serve.w / 2, serve.y + serve.h / 2 + 22, 14, '#eaf5e2', 'normal');
  ctx.fillStyle = '#8a5a33';
  rr(ctx, trash.x, trash.y, trash.w, trash.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#6e4525';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'TRASH PLATE  (T)', trash.x + trash.w / 2, trash.y + trash.h / 2, 20, COLORS.cream);
}

function drawCounter(ctx, k) {
  const L = layout();
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(0, COUNTER_Y, VIEW_W, VIEW_H - COUNTER_Y);
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(0, COUNTER_Y, VIEW_W, 4);
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const ing = INGREDIENTS[i];
    const bin = L.bins[i];
    const isPatty = ing.id === 'patty';
    ctx.fillStyle = isPatty ? '#4a2f22' : COLORS.panel;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 14);
    ctx.fill();
    ctx.strokeStyle = isPatty ? '#7a5238' : COLORS.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, ing.id, bin.x + bin.w / 2, bin.y + 62, 84);
    text(ctx, ing.name, bin.x + bin.w / 2, bin.y + 122, 22, isPatty ? COLORS.cream : COLORS.ink);
    text(ctx, isPatty ? 'goes to the GRILL' : `key ${ing.key}`, bin.x + bin.w / 2, bin.y + 146, 14, isPatty ? '#d9b380' : '#8a7a68', 'normal');
    // Key cap.
    ctx.fillStyle = '#2b1a12';
    rr(ctx, bin.x + 10, bin.y + 10, 26, 26, 6);
    ctx.fill();
    text(ctx, ing.key, bin.x + 23, bin.y + 24, 16, COLORS.cream);
  }
}

function drawPopups(ctx, k) {
  for (const p of k.popups) {
    const alpha = 1 - p.t / p.life;
    ctx.globalAlpha = Math.max(0, alpha);
    text(ctx, p.text, p.x, p.y - p.t * 34, 26, p.color);
    ctx.globalAlpha = 1;
  }
}

function drawStartScreen(ctx, k) {
  ctx.fillStyle = 'rgba(43,26,18,0.92)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '🍳 SIZZLE & SERVE', VIEW_W / 2, 120, 64, COLORS.gold);
  text(ctx, '12 orders · 7 ingredients · 1 stove on fire', VIEW_W / 2, 178, 30, COLORS.cream);
  text(ctx, 'A 2-minute cooking rush. Take the tickets, grill the patties,', VIEW_W / 2, 260, 24, COLORS.cream, 'normal');
  text(ctx, 'stack the plate exactly as ordered — and serve before patience runs out.', VIEW_W / 2, 292, 24, COLORS.cream, 'normal');
  const lines = [
    '1–7 or CLICK  ·  add an ingredient (patty goes to the grill)',
    'CLICK a golden patty  ·  move it from grill to plate',
    'SPACE / SERVE  ·  serve the plate to a matching order',
    'T  ·  trash the plate     M  ·  mute',
  ];
  lines.forEach((line, i) => text(ctx, line, VIEW_W / 2, 360 + i * 34, 21, '#e8dcc8', 'normal'));
  // A row of the seven ingredients, drawn by the same code that draws the game.
  INGREDIENTS.forEach((ing, i) => {
    drawIngredient(ctx, ing.id, 300 + i * 113, 540, 72);
  });
  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  if (blink) text(ctx, 'CLICK OR PRESS ENTER TO START YOUR SHIFT', VIEW_W / 2, 632, 26, COLORS.gold);
  text(ctx, 'Best served hot. Tips are paid in combos.', VIEW_W / 2, 668, 16, '#b9a68f', 'normal');
}

function drawEndScreen(ctx, k) {
  ctx.fillStyle = 'rgba(43,26,18,0.94)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SHIFT OVER!', VIEW_W / 2, 110, 58, COLORS.gold);
  text(ctx, `GRADE ${k.grade}`, VIEW_W / 2, 200, 84, k.grade === 'S' ? '#ffd94d' : COLORS.cream);
  const rows = [
    ['Orders served', String(k.served)],
    ['Mistakes', String(k.mistakes)],
    ['Best combo', `x${Math.max(1, k.bestCombo)}`],
    ['Final score', String(k.score)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 300 + i * 48;
    text(ctx, label, VIEW_W / 2 - 40, y, 26, '#e8dcc8', 'normal', 'right');
    text(ctx, value, VIEW_W / 2 + 40, y, 26, COLORS.cream, 'bold', 'left');
  });
  const verdict =
    k.grade === 'S'
      ? 'The kitchen sings your name. The rush never stood a chance.'
      : k.grade === 'A'
        ? 'A fine service — the board stayed clear and the grill stayed hot.'
        : k.grade === 'B'
          ? 'A solid shift. A few more clean serves and the rush is yours.'
          : 'The kitchen got the better of you this time. Run it back.';
  text(ctx, verdict, VIEW_W / 2, 520, 22, COLORS.cream, 'normal');
  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  if (blink) text(ctx, 'PRESS ENTER TO PLAY AGAIN', VIEW_W / 2, 600, 26, COLORS.gold);
}

function drawBackground(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Tile backsplash behind the board.
  ctx.fillStyle = COLORS.tile;
  ctx.fillRect(0, BOARD_Y - 8, VIEW_W, BOARD_H + 16);
  ctx.strokeStyle = 'rgba(255,243,214,0.08)';
  ctx.lineWidth = 2;
  for (let x = 0; x < VIEW_W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, BOARD_Y - 8);
    ctx.lineTo(x, BOARD_Y + BOARD_H + 8);
    ctx.stroke();
  }
  for (let y = BOARD_Y - 8; y < BOARD_Y + BOARD_H + 8; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
}

// --- The scene. --------------------------------------------------------------
export function drawScene(ctx, k) {
  drawBackground(ctx);
  drawTopBar(ctx, k);
  if (k.screen === 'start') {
    drawBoard(ctx, k);
    drawGrill(ctx, k);
    drawPlate(ctx, k);
    drawCounter(ctx, k);
    drawStartScreen(ctx, k);
    return;
  }
  drawBoard(ctx, k);
  drawGrill(ctx, k);
  drawPlate(ctx, k);
  drawCounter(ctx, k);
  drawPopups(ctx, k);
  if (k.flash) {
    ctx.globalAlpha = Math.min(0.35, k.flash.t);
    ctx.fillStyle = k.flash.color;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
  }
  if (k.screen === 'end') drawEndScreen(ctx, k);
}
