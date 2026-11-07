import { describe, expect, it } from 'vitest';
import { DIRECTIONS, neighbour, parseHex } from './hex';
import { formatHexside, hexside, hexsideOf, isBoardHexside, parseHexside } from './hexside';

describe('hexsides', () => {
  it('writes the same edge the same way from either hex', () => {
    const cherbourg = parseHex('K16');
    for (const direction of DIRECTIONS) {
      const other = neighbour(cherbourg, direction);
      expect(formatHexside(hexside(cherbourg, other))).toBe(
        formatHexside(hexside(other, cherbourg)),
      );
    }
  });

  it('gives a hex six different edges', () => {
    const cherbourg = parseHex('K16');
    const labels = DIRECTIONS.map((direction) => formatHexside(hexsideOf(cherbourg, direction)));
    expect(new Set(labels).size).toBe(6);
    expect(labels).toEqual(['K16/L16', 'K16/K17', 'K16/J17', 'J16/K16', 'K15/K16', 'L15/K16']);
  });

  it('rejects hexes that are not adjacent', () => {
    expect(() => hexside(parseHex('K16'), parseHex('K18'))).toThrow();
    expect(() => hexside(parseHex('K16'), parseHex('K16'))).toThrow();
  });

  it('reads its own labels back', () => {
    const side = hexside(parseHex('SS-1'), parseHex('RR0'));
    expect(parseHexside(formatHexside(side))).toEqual(side);
  });

  it.each(['L16/K16', 'K16', 'K16/L16/M16', 'K16/K18', 'k16/L16'])('rejects %s', (label) => {
    expect(() => parseHexside(label)).toThrow();
  });

  it('knows which edges are on the board', () => {
    expect(isBoardHexside(parseHexside('K16/L16'))).toBe(true);
    expect(isBoardHexside(parseHexside('RR2/SS2'))).toBe(false);
  });
});
