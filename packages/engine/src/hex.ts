/**
 * Hex grid maths for the board's pencilled numbering (docs/rules/hex-numbering.md).
 * A hex is a letter index `l` and a number `n`, which together form axial coordinates.
 * These functions don't know the board's outline: results can fall off the map.
 */

export interface Hex {
  readonly l: number;
  readonly n: number;
}

/** Directions on the board as played (north to the left), clockwise from up. */
export const DIRECTIONS = [
  'up',
  'upperRight',
  'lowerRight',
  'down',
  'lowerLeft',
  'upperLeft',
] as const;

export type Direction = (typeof DIRECTIONS)[number];

const DIRECTION_OFFSETS: Record<Direction, Hex> = {
  up: { l: 1, n: 0 },
  upperRight: { l: 0, n: 1 },
  lowerRight: { l: -1, n: 1 },
  down: { l: -1, n: 0 },
  lowerLeft: { l: 0, n: -1 },
  upperLeft: { l: 1, n: -1 },
};

const LOWERCASE_LETTERS = 'rstuvwxyz';
const MIN_LETTER_INDEX = -8;
const MAX_LETTER_INDEX = 52;
const HEX_LABEL = /^([r-z]|[A-Z]|([A-Z])\2)([1-9]\d*)$/;

// Keeps rounding off exact ties, so a line between two hexes never depends on float noise.
const LINE_NUDGE_L = 1e-6;
const LINE_NUDGE_N = 2e-6;

const A_CHAR_CODE = 'A'.charCodeAt(0);

function letterToIndex(letter: string): number {
  if (letter.length === 2) return letter.charCodeAt(0) - A_CHAR_CODE + 27;
  const lowercase = LOWERCASE_LETTERS.indexOf(letter);
  if (lowercase !== -1) return lowercase + MIN_LETTER_INDEX;
  return letter.charCodeAt(0) - A_CHAR_CODE + 1;
}

function indexToLetter(index: number): string {
  if (index <= 0) return LOWERCASE_LETTERS.charAt(index - MIN_LETTER_INDEX);
  if (index <= 26) return String.fromCharCode(A_CHAR_CODE + index - 1);
  return String.fromCharCode(A_CHAR_CODE + index - 27).repeat(2);
}

/** Reads a label such as `K16`, `QQ2` or `v44`. Labels are case-sensitive. */
export function parseHex(label: string): Hex {
  const match = HEX_LABEL.exec(label);
  if (!match) throw new RangeError(`Invalid hex label: ${label}`);
  const [, letter = '', , number = ''] = match;
  return { l: letterToIndex(letter), n: Number(number) };
}

/** Writes a hex as its label. Throws for a hex the numbering has no label for. */
export function formatHex({ l, n }: Hex): string {
  const labelled =
    Number.isInteger(l) &&
    Number.isInteger(n) &&
    l >= MIN_LETTER_INDEX &&
    l <= MAX_LETTER_INDEX &&
    n >= 1;
  if (!labelled) throw new RangeError(`Hex has no label: ${l},${n}`);
  return `${indexToLetter(l)}${n}`;
}

export function hexEquals(a: Hex, b: Hex): boolean {
  return a.l === b.l && a.n === b.n;
}

export function neighbour(hex: Hex, direction: Direction): Hex {
  const offset = DIRECTION_OFFSETS[direction];
  return { l: hex.l + offset.l, n: hex.n + offset.n };
}

/** The six surrounding hexes, in `DIRECTIONS` order. */
export function neighbours(hex: Hex): Hex[] {
  return DIRECTIONS.map((direction) => neighbour(hex, direction));
}

export function hexDistance(a: Hex, b: Hex): number {
  const dl = b.l - a.l;
  const dn = b.n - a.n;
  return Math.max(Math.abs(dl), Math.abs(dn), Math.abs(dl + dn));
}

function roundHex(l: number, n: number): Hex {
  const s = -l - n;
  let roundedL = Math.round(l);
  let roundedN = Math.round(n);
  const roundedS = Math.round(s);
  const errorL = Math.abs(roundedL - l);
  const errorN = Math.abs(roundedN - n);
  const errorS = Math.abs(roundedS - s);
  if (errorL > errorN && errorL > errorS) roundedL = -roundedN - roundedS;
  else if (errorN > errorS) roundedN = -roundedL - roundedS;
  // Adding 0 turns -0 into 0.
  return { l: roundedL + 0, n: roundedN + 0 };
}

/** The hexes on the straight line from `from` to `to`, both included. */
export function hexLine(from: Hex, to: Hex): Hex[] {
  const steps = hexDistance(from, to);
  const line: Hex[] = [];
  for (let step = 0; step <= steps; step++) {
    const t = steps === 0 ? 0 : step / steps;
    const l = from.l + (to.l - from.l) * t + LINE_NUDGE_L;
    const n = from.n + (to.n - from.n) * t + LINE_NUDGE_N;
    line.push(roundHex(l, n));
  }
  return line;
}
