// Sizzle & Serve — tuning constants: the numbers that set the pace of a shift.
// One file, one job: every magic number the kitchen uses lives here so the
// other modules read names, never literals.
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 120;
export const MAX_ORDERS = 3;
export const GRILL_SLOTS = 2;
export const PATTY_COOK_SECONDS = 4;

export const SCORE_SERVE = 100;
export const SCORE_SPEED_BONUS = 50;
export const SCORE_WRONG = -25;
export const SCORE_EXPIRED = -50;
export const MAX_COMBO = 3;

// Patience an order is born with (seconds), early shift -> late shift.
export const PATIENCE_EARLY = 34;
export const PATIENCE_LATE = 20;
// Seconds between new orders arriving, early shift -> late shift.
export const SPAWN_EARLY = 12;
export const SPAWN_LATE = 7;

// Layout: top bar, order board, worktop, ingredient counter.
export const TOP_BAR_H = 64;
export const BOARD_Y = 76;
export const BOARD_H = 118;
export const WORKTOP_Y = 208;
export const WORKTOP_H = 262;
export const COUNTER_Y = 486;
export const COUNTER_H = 214;

// Warm kitchen palette: wood, tile, brass, cream.
export const COLORS = {
  wall: '#3a241a',
  tile: '#4a2f22',
  wood: '#8a5a33',
  woodDark: '#6e4525',
  brass: '#e8a93c',
  cream: '#fff3d6',
  ink: '#2b1a12',
  red: '#d94f3d',
  green: '#5da24a',
  gold: '#f2c14e',
  panel: '#fff8e7',
  panelEdge: '#d9b380',
};
