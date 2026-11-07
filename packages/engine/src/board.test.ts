import { describe, expect, it } from 'vitest';
import { boardHexes, isBoardHex } from './board';
import { hexEquals, parseHex } from './hex';

describe('board hexes', () => {
  const hexes = boardHexes();
  const onBoard = (label: string) => hexes.some((hex) => hexEquals(hex, parseHex(label)));

  it.each(['K16', 'B21', 'O17', 'S20', 'S21', 'R21', 'QQ2', 'N45', 'v44', 'r47', 'v47'])(
    'includes reference hex %s',
    (label) => {
      expect(onBoard(label)).toBe(true);
    },
  );

  it('follows the top edge of the board', () => {
    for (const label of ['RR2', 'QQ4', 'PP6', 'OO8']) {
      expect(onBoard(label)).toBe(true);
    }
    for (const label of ['SS2', 'RR4', 'QQ6', 'PP8']) {
      expect(onBoard(label)).toBe(false);
    }
  });

  it('agrees with the list of hexes about what is on the board', () => {
    for (const hex of hexes) expect(isBoardHex(hex)).toBe(true);
    expect(isBoardHex(parseHex('SS2'))).toBe(false);
    expect(isBoardHex({ l: 20, n: 48 })).toBe(false);
    expect(isBoardHex({ l: 20, n: -2 })).toBe(false);
  });

  it('holds each hex once', () => {
    expect(new Set(hexes.map((hex) => `${hex.l},${hex.n}`)).size).toBe(hexes.length);
  });
});
