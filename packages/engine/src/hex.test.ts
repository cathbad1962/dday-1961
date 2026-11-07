import { describe, expect, it } from 'vitest';
import {
  DIRECTIONS,
  formatHex,
  hexDistance,
  hexEquals,
  hexLine,
  neighbour,
  neighbours,
  parseHex,
  type Hex,
} from './hex';

const labels = (hexes: Hex[]) => hexes.map(formatHex);

function grid(minL: number, maxL: number, minN: number, maxN: number): Hex[] {
  const hexes: Hex[] = [];
  for (let l = minL; l <= maxL; l++) {
    for (let n = minN; n <= maxN; n++) hexes.push({ l, n });
  }
  return hexes;
}

describe('hex labels', () => {
  it('maps letters to the documented indexes', () => {
    expect(parseHex('r47')).toEqual({ l: -8, n: 47 });
    expect(parseHex('z1')).toEqual({ l: 0, n: 1 });
    expect(parseHex('A1')).toEqual({ l: 1, n: 1 });
    expect(parseHex('Z1')).toEqual({ l: 26, n: 1 });
    expect(parseHex('AA1')).toEqual({ l: 27, n: 1 });
    expect(parseHex('QQ2')).toEqual({ l: 43, n: 2 });
    expect(parseHex('ZZ1')).toEqual({ l: 52, n: 1 });
  });

  it('labels the columns north of 1', () => {
    expect(parseHex('SS-1')).toEqual({ l: 45, n: -1 });
    expect(formatHex({ l: 45, n: 0 })).toBe('SS0');
  });

  it('treats case as significant', () => {
    expect(parseHex('v44')).toEqual({ l: -4, n: 44 });
    expect(parseHex('V44')).toEqual({ l: 22, n: 44 });
  });

  it.each(['', 'K', '16', 'K016', 'K-2', 'K1.5', 'a1', 'q1', 'AB1', 'aa1', 'AAA1', ' K16'])(
    'rejects %j',
    (label) => {
      expect(() => parseHex(label)).toThrow(RangeError);
    },
  );

  it('round-trips every letter', () => {
    for (let l = -8; l <= 52; l++) {
      const hex = { l, n: 7 };
      expect(parseHex(formatHex(hex))).toEqual(hex);
    }
  });

  it.each([
    [-9, 1],
    [53, 1],
    [1, -2],
    [1.5, 1],
  ])('has no label for %d,%d', (l, n) => {
    expect(() => formatHex({ l, n })).toThrow(RangeError);
  });
});

describe('hex neighbours', () => {
  it('finds the six neighbours of Cherbourg', () => {
    expect(labels(neighbours(parseHex('K16')))).toEqual(['L16', 'K17', 'J17', 'J16', 'K15', 'L15']);
  });

  it('crosses from the capital letters into the lowercase ones', () => {
    expect(formatHex(neighbour(parseHex('A30'), 'down'))).toBe('z30');
  });

  it('crosses from single letters into double letters', () => {
    expect(formatHex(neighbour(parseHex('Z10'), 'up'))).toBe('AA10');
  });

  it('has opposite directions that undo each other', () => {
    const hex = parseHex('K16');
    DIRECTIONS.forEach((direction, index) => {
      const opposite = DIRECTIONS[(index + 3) % 6]!;
      expect(neighbour(neighbour(hex, direction), opposite)).toEqual(hex);
    });
  });

  it('places the three Paris hexes next to each other', () => {
    const [a, b, c] = ['S20', 'S21', 'R21'].map(parseHex) as [Hex, Hex, Hex];
    expect(hexDistance(a, b)).toBe(1);
    expect(hexDistance(b, c)).toBe(1);
    expect(hexDistance(a, c)).toBe(1);
  });
});

describe('hex distance', () => {
  it('is zero to itself and one to each neighbour', () => {
    const hex = parseHex('K16');
    expect(hexDistance(hex, hex)).toBe(0);
    for (const next of neighbours(hex)) expect(hexDistance(hex, next)).toBe(1);
  });

  it('measures between reference hexes', () => {
    expect(hexDistance(parseHex('K16'), parseHex('B21'))).toBe(9);
    expect(hexDistance(parseHex('K16'), parseHex('O17'))).toBe(5);
  });

  it('matches the shortest walk across the grid', () => {
    const start = parseHex('A10');
    const walked = new Map<string, number>([[formatHex(start), 0]]);
    let frontier = [start];
    for (let steps = 1; steps <= 8; steps++) {
      const next: Hex[] = [];
      for (const hex of frontier) {
        for (const adjacent of neighbours(hex)) {
          const label = formatHex(adjacent);
          if (walked.has(label)) continue;
          walked.set(label, steps);
          next.push(adjacent);
        }
      }
      frontier = next;
    }
    for (const [label, steps] of walked) expect(hexDistance(start, parseHex(label))).toBe(steps);
  });
});

describe('hex line', () => {
  it('is a single hex when both ends match', () => {
    const hex = parseHex('K16');
    expect(hexLine(hex, hex)).toEqual([hex]);
  });

  it('follows a straight row', () => {
    expect(labels(hexLine(parseHex('K16'), parseHex('N16')))).toEqual(['K16', 'L16', 'M16', 'N16']);
  });

  it('follows a diagonal', () => {
    expect(labels(hexLine(parseHex('K16'), parseHex('H19')))).toEqual(['K16', 'J17', 'I18', 'H19']);
  });

  it('crosses the lowercase letters without a kink', () => {
    expect(labels(hexLine(parseHex('B30'), parseHex('y30')))).toEqual(['B30', 'A30', 'z30', 'y30']);
  });

  it('links neighbouring hexes from end to end, for every pair of hexes', () => {
    const hexes = grid(-3, 4, 1, 8);
    for (const from of hexes) {
      for (const to of hexes) {
        const line = hexLine(from, to);
        expect(line).toHaveLength(hexDistance(from, to) + 1);
        expect(hexEquals(line[0]!, from)).toBe(true);
        expect(hexEquals(line.at(-1)!, to)).toBe(true);
        for (let i = 1; i < line.length; i++) {
          expect(hexDistance(line[i - 1]!, line[i]!)).toBe(1);
        }
      }
    }
  });
});
