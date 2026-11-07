/**
 * Hexsides: the edge shared by two adjacent hexes, where rivers run (rules spec 2.2).
 * Each hexside has one form, written from the hex in the lower column, or the lower
 * hex in the same column, so the same edge can't be stored twice under two names.
 */

import { isBoardHex } from './board';
import { formatHex, hexDistance, neighbour, parseHex, type Direction, type Hex } from './hex';

export interface Hexside {
  /** The hex in the lower-numbered column, or the lower letter if they share a column. */
  readonly from: Hex;
  readonly to: Hex;
}

/** The three directions a hexside is written in. Their opposites are written from the other hex. */
export const HEXSIDE_DIRECTIONS: readonly Direction[] = ['up', 'upperRight', 'lowerRight'];

function isForward(from: Hex, to: Hex): boolean {
  const dn = to.n - from.n;
  return dn > 0 || (dn === 0 && to.l > from.l);
}

/** The edge between two adjacent hexes, in either order. */
export function hexside(a: Hex, b: Hex): Hexside {
  if (hexDistance(a, b) !== 1) {
    throw new RangeError(`Hexes aren't adjacent: ${a.l},${a.n} and ${b.l},${b.n}`);
  }
  return isForward(a, b) ? { from: a, to: b } : { from: b, to: a };
}

/** The edge of `hex` on its `direction` side. */
export function hexsideOf(hex: Hex, direction: Direction): Hexside {
  return hexside(hex, neighbour(hex, direction));
}

/** Writes a hexside as its two hex labels, such as `K16/L16`. */
export function formatHexside({ from, to }: Hexside): string {
  return `${formatHex(from)}/${formatHex(to)}`;
}

/** Reads a hexside label. Throws unless the hexes are adjacent and in the written order. */
export function parseHexside(label: string): Hexside {
  const parts = label.split('/');
  if (parts.length !== 2) throw new RangeError(`Invalid hexside label: ${label}`);
  const [from, to] = parts.map(parseHex) as [Hex, Hex];
  const side = hexside(from, to);
  if (side.from !== from) throw new RangeError(`Hexside written backwards: ${label}`);
  return side;
}

/** True if both hexes are on the board. */
export function isBoardHexside({ from, to }: Hexside): boolean {
  return isBoardHex(from) && isBoardHex(to);
}
