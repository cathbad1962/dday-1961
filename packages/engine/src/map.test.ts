import { describe, expect, it } from 'vitest';
import { parseMapData, serialiseMapData } from './map';

describe('map data', () => {
  it('accepts a painted map', () => {
    const map = {
      version: 1,
      terrain: { K16: 'fortress', B21: 'fortress', 'SS-1': 'sea' },
      hexsides: { 'K16/L16': 'river', 'II5/II6': 'rhine-ijssel' },
    };
    expect(parseMapData(map)).toEqual(map);
  });

  it('reads a map saved before hexsides existed', () => {
    expect(parseMapData({ version: 1, terrain: {} })).toEqual({
      version: 1,
      terrain: {},
      hexsides: {},
    });
  });

  it.each([
    ['a missing version', { terrain: {} }],
    ['an unknown version', { version: 2, terrain: {} }],
    ['an unknown terrain', { version: 1, terrain: { K16: 'swamp' } }],
    ['a malformed label', { version: 1, terrain: { k16: 'clear' } }],
    ['a hex off the board', { version: 1, terrain: { SS2: 'clear' } }],
    ['an unknown hexside feature', { version: 1, terrain: {}, hexsides: { 'K16/L16': 'canal' } }],
    ['a hexside written backwards', { version: 1, terrain: {}, hexsides: { 'L16/K16': 'river' } }],
    ['hexes that are not adjacent', { version: 1, terrain: {}, hexsides: { 'K16/K18': 'river' } }],
    ['a hexside off the board', { version: 1, terrain: {}, hexsides: { 'RR2/SS2': 'river' } }],
  ])('rejects %s', (_name, map) => {
    expect(() => parseMapData(map)).toThrow();
  });

  it('writes the same text whatever order the map was drawn in', () => {
    const first = serialiseMapData({
      version: 1,
      terrain: { K16: 'clear', B21: 'city' },
      hexsides: { 'K16/L16': 'river', 'B21/C21': 'river' },
    });
    const second = serialiseMapData({
      version: 1,
      terrain: { B21: 'city', K16: 'clear' },
      hexsides: { 'B21/C21': 'river', 'K16/L16': 'river' },
    });
    expect(first).toBe(second);
  });

  it('survives a save and a load', () => {
    const map = {
      version: 1,
      terrain: { K16: 'clear', z30: 'sea' },
      hexsides: { 'K16/L16': 'river', 'SS-1/SS0': 'rhine-ijssel' },
    } as const;
    expect(parseMapData(JSON.parse(serialiseMapData(map)))).toEqual(map);
  });
});
