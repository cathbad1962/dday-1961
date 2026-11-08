import { describe, expect, it } from 'vitest';
import { parseMapData, serialiseMapData, sortHexLabels, type MapData } from './map';

const EMPTY: MapData = {
  version: 1,
  terrain: {},
  hexsides: {},
  stars: [],
  supply: {},
  ports: {},
  invasionAreas: {},
};

describe('map data', () => {
  it('accepts a map with every section', () => {
    const map = {
      version: 1,
      terrain: { K16: 'fortress', B21: 'fortress', 'SS-1': 'sea' },
      hexsides: { 'K16/L16': 'river', 'II5/II6': 'rhine-ijssel' },
      stars: ['MM6', 'NN5'],
      supply: {
        RR1: { to: 'QQ3', capacity: 25, boxed: true, port: 'Bremen' },
        FF5: { to: 'GG5', capacity: 2, boxed: false },
      },
      ports: { Bremen: { letter: 'B', hexes: ['QQ3', 'PP3'] } },
      invasionAreas: { 'North Sea': ['FF5', 'GG5'] },
    };
    expect(parseMapData(map)).toEqual(map);
  });

  it('reads a map saved before the later sections existed', () => {
    expect(parseMapData({ version: 1, terrain: {} })).toEqual(EMPTY);
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
    ['a star off the board', { version: 1, terrain: {}, stars: ['SS2'] }],
    ['a star listed twice', { version: 1, terrain: {}, stars: ['K16', 'K16'] }],
    [
      'a supply number of zero',
      { version: 1, terrain: {}, supply: { K16: { to: 'K17', capacity: 0, boxed: false } } },
    ],
    [
      'a supply number for a missing port',
      {
        version: 1,
        terrain: {},
        supply: { K16: { to: 'K17', capacity: 7, boxed: true, port: 'Rouen' } },
      },
    ],
    [
      'a port letter that is not one capital',
      { version: 1, terrain: {}, ports: { Rouen: { letter: 'r', hexes: [] } } },
    ],
    ['an unknown invasion area', { version: 1, terrain: {}, invasionAreas: { Norway: ['K16'] } }],
  ])('rejects %s', (_name, map) => {
    expect(() => parseMapData(map)).toThrow();
  });

  it('writes the same text whatever order the map was drawn in', () => {
    const first = serialiseMapData({
      ...EMPTY,
      terrain: { K16: 'clear', B21: 'city' },
      hexsides: { 'K16/L16': 'river', 'B21/C21': 'river' },
      stars: ['K16', 'B21'],
      ports: { Rouen: { letter: 'R', hexes: ['K16', 'B21'] }, Bremen: { letter: 'B', hexes: [] } },
      invasionAreas: { Normandy: ['K16', 'B21'] },
    });
    const second = serialiseMapData({
      ...EMPTY,
      terrain: { B21: 'city', K16: 'clear' },
      hexsides: { 'B21/C21': 'river', 'K16/L16': 'river' },
      stars: ['B21', 'K16'],
      ports: { Bremen: { letter: 'B', hexes: [] }, Rouen: { letter: 'R', hexes: ['B21', 'K16'] } },
      invasionAreas: { Normandy: ['B21', 'K16'] },
    });
    expect(first).toBe(second);
  });

  it('survives a save and a load', () => {
    const map: MapData = {
      version: 1,
      terrain: { K16: 'clear', z30: 'sea' },
      hexsides: { 'K16/L16': 'river', 'SS-1/SS0': 'rhine-ijssel' },
      stars: ['K16'],
      supply: { z30: { to: 'z31', capacity: 5, boxed: false } },
      ports: { Rouen: { letter: 'R', hexes: ['K16'] } },
      invasionAreas: { 'Le Havre': ['K16', 'z30'] },
    };
    expect(parseMapData(JSON.parse(serialiseMapData(map)))).toEqual(map);
  });

  it('sorts hexes into board order', () => {
    expect(sortHexLabels(['K17', 'B21', 'K16'])).toEqual(['K16', 'K17', 'B21']);
  });
});
