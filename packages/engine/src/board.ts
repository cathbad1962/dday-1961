/**
 * The rectangle of hexes that covers the board as played (north to the left).
 * Sea with no printed hexes lies inside it; the map data decides which hexes exist.
 * Measured from photos of Karl's board: see docs/rules/hex-numbering.md.
 */

import type { Hex } from './hex';

/** Bremen is in column 2, and two columns of hexes lie to its north of column 1. */
const FIRST_COLUMN = -1;
const LAST_COLUMN = 47;

const LOWEST_LETTER = -8;

// Edges of the board as heights: a hex's height is l + n / 2.
const TOP_EDGE = 45;
const BOTTOM_EDGE = 11.5;

export function boardHexes(): Hex[] {
  const hexes: Hex[] = [];
  for (let n = FIRST_COLUMN; n <= LAST_COLUMN; n++) {
    const highest = Math.floor(TOP_EDGE - n / 2);
    const lowest = Math.max(LOWEST_LETTER, Math.ceil(BOTTOM_EDGE - n / 2));
    for (let l = lowest; l <= highest; l++) hexes.push({ l, n });
  }
  return hexes;
}
