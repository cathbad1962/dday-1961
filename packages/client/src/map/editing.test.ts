import { parseHex } from '@dday/engine';
import { describe, expect, it } from 'vitest';
import { paintHexes } from './editing';

describe('painting terrain', () => {
  it('paints hexes', () => {
    expect(paintHexes({}, ['K16', 'K17'].map(parseHex), 'sea')).toEqual({ K16: 'sea', K17: 'sea' });
  });

  it('replaces terrain already painted', () => {
    expect(paintHexes({ K16: 'sea' }, [parseHex('K16')], 'clear')).toEqual({ K16: 'clear' });
  });

  it('erases hexes', () => {
    expect(paintHexes({ K16: 'sea' }, [parseHex('K16')], 'erase')).toEqual({});
  });

  it('ignores hexes off the board', () => {
    expect(paintHexes({}, [parseHex('SS2'), { l: 20, n: 60 }], 'sea')).toEqual({});
  });

  it('returns the same object when nothing changes', () => {
    const terrain = { K16: 'sea' } as const;
    expect(paintHexes(terrain, [parseHex('K16')], 'sea')).toBe(terrain);
    expect(paintHexes(terrain, [parseHex('K17')], 'erase')).toBe(terrain);
  });
});
