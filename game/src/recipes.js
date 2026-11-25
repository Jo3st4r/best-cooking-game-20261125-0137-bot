// Sizzle & Serve — the menu: 7 ingredients and the 6 dishes the order board
// can ask for. A dish is a multiset of ingredient ids; the plate must match
// one open order exactly to serve it.
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8a93c', dark: '#c98a2b' },
  { id: 'patty', name: 'Patty', key: '2', color: '#7a4a2b', dark: '#5e3820' },
  { id: 'lettuce', name: 'Lettuce', key: '3', color: '#6fbf4a', dark: '#4e9a33' },
  { id: 'tomato', name: 'Tomato', key: '4', color: '#e0523e', dark: '#b23a2c' },
  { id: 'cheese', name: 'Cheese', key: '5', color: '#f2c14e', dark: '#d9a52e' },
  { id: 'onion', name: 'Onion', key: '6', color: '#efe6f2', dark: '#c9b8d4' },
  { id: 'sauce', name: 'Sauce', key: '7', color: '#f07f3c', dark: '#c96428' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);

export const DISHES = [
  { name: 'Classic Burger', needs: ['bun', 'patty', 'lettuce'], stars: 1 },
  { name: 'Cheese Melt', needs: ['bun', 'patty', 'cheese'], stars: 1 },
  { name: 'Garden Stack', needs: ['bun', 'lettuce', 'tomato', 'onion'], stars: 2 },
  { name: 'Saucy Deluxe', needs: ['bun', 'patty', 'cheese', 'sauce'], stars: 2 },
  { name: 'Fresh Crunch', needs: ['bun', 'tomato', 'lettuce', 'onion', 'sauce'], stars: 3 },
  { name: 'Double Trouble', needs: ['bun', 'patty', 'patty', 'cheese'], stars: 3 },
];

// Dishes the board may ask for at a given moment of the shift: 1-star dishes
// early, the full menu once the rush is on.
export function dishesAvailable(elapsedSeconds) {
  if (elapsedSeconds < 30) return DISHES.filter((d) => d.stars === 1);
  if (elapsedSeconds < 70) return DISHES.filter((d) => d.stars <= 2);
  return DISHES;
}

// Do two multisets of ingredient ids hold the same items?
export function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const id of a) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const id of b) {
    const left = counts.get(id) ?? 0;
    if (left === 0) return false;
    counts.set(id, left - 1);
  }
  return true;
}
