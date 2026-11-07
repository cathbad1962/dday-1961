import { describe, expect, it } from 'vitest';
import { parseMapData, serialiseMapData } from './map';

describe('map data', () => {
  it('accepts a painted map', () => {
    const map = { version: 1, terrain: { K16: 'fortress', B21: 'fortress', 'SS-1': 'sea' } };
    expect(parseMapData(map)).toEqual(map);
  });

  it.each([
    ['a missing version', { terrain: {} }],
    ['an unknown version', { version: 2, terrain: {} }],
    ['an unknown terrain', { version: 1, terrain: { K16: 'swamp' } }],
    ['a malformed label', { version: 1, terrain: { k16: 'clear' } }],
    ['a hex off the board', { version: 1, terrain: { SS2: 'clear' } }],
  ])('rejects %s', (_name, map) => {
    expect(() => parseMapData(map)).toThrow();
  });

  it('writes the same text whatever order the hexes were painted in', () => {
    const first = serialiseMapData({ version: 1, terrain: { K16: 'clear', B21: 'city' } });
    const second = serialiseMapData({ version: 1, terrain: { B21: 'city', K16: 'clear' } });
    expect(first).toBe(second);
  });

  it('survives a save and a load', () => {
    const map = { version: 1, terrain: { K16: 'clear', z30: 'sea' } } as const;
    expect(parseMapData(JSON.parse(serialiseMapData(map)))).toEqual(map);
  });
});
