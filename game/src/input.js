// Sizzle & Serve — input: keyboard and mouse/touch, normalised to game
// coordinates. The game hands this module a converter (client pixels -> the
// 1280x720 game space) and two callbacks; this module owns no game logic.
export function attachInput(canvas, { toGame, onTap, onKey }) {
  function tapFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const p = toGame(x, y);
    if (p) onTap(p.x, p.y);
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    tapFromEvent(event);
  });

  window.addEventListener('keydown', (event) => {
    // Ignore repeats and keys typed into form fields (there are none, but be safe).
    if (event.repeat) return;
    if (event.target && /INPUT|TEXTAREA/.test(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
    }
    onKey(key);
  });
}

// Is a point inside a rectangle? The hit test every button and bin uses.
export function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
