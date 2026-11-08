import { describe, expect, it } from 'vitest';
import { boardHexes } from './board';
import { formatHex } from './hex';
import {
  INVASION_AREAS,
  type InvasionArea,
  type MapData,
  type SupplyArrow,
  type TerrainType,
} from './map';
import { validateMap, type MapIssue } from './validateMap';

/**
 * Every hex clear, and every invasion area entered with one beach, so only the problem under
 * test is reported. Area number i is the sea hex A(30+i) with a 2 pointing to B(30+i).
 * Terrain in `changes` is painted over the clear hexes; other sections replace the defaults.
 */
function finishedMap({ terrain: changedTerrain, ...changes }: Partial<MapData> = {}): MapData {
  const terrain: Record<string, TerrainType> = {};
  for (const hex of boardHexes()) terrain[formatHex(hex)] = 'clear';
  const supply: Record<string, SupplyArrow> = {};
  const invasionAreas: Partial<Record<InvasionArea, string[]>> = {};
  INVASION_AREAS.forEach((area, index) => {
    const sea = `A${30 + index}`;
    const beach = `B${30 + index}`;
    terrain[sea] = 'sea';
    supply[sea] = { to: beach, capacity: 2, boxed: false };
    invasionAreas[area] = [sea, beach];
  });
  return {
    version: 1,
    terrain: { ...terrain, ...changedTerrain },
    hexsides: {},
    stars: [],
    supply,
    ports: {},
    invasionAreas,
    ...changes,
  };
}

function messages(issues: MapIssue[]): string[] {
  return issues.map(({ level, message }) => `${level}: ${message}`);
}

describe('map validation', () => {
  it('finds nothing wrong with a finished map', () => {
    expect(validateMap(finishedMap())).toEqual([]);
  });

  it('lists unpainted hexes and areas not yet entered on an empty map', () => {
    const issues = validateMap({
      version: 1,
      terrain: {},
      hexsides: {},
      stars: [],
      supply: {},
      ports: {},
      invasionAreas: {},
    });
    expect(issues[0]?.message).toMatch(/^\d+ hexes not painted yet$/);
    expect(issues[0]?.hexes.length).toBe(boardHexes().length);
    expect(issues).toHaveLength(1 + INVASION_AREAS.length);
  });

  it('flags a river along the coast', () => {
    const map = finishedMap({ terrain: { L16: 'sea' }, hexsides: { 'K16/L16': 'river' } });
    expect(messages(validateMap(map))).toEqual([
      'warning: 1 river edge not between two land hexes',
    ]);
  });

  it('flags a star at sea', () => {
    const map = finishedMap({ terrain: { K16: 'sea' }, stars: ['K16', 'K17'] });
    expect(validateMap(map)).toEqual([
      { level: 'error', message: '1 star not on land', hexes: ['K16'] },
    ]);
  });

  it('flags a hex in two invasion areas', () => {
    const map = finishedMap();
    const areas = {
      ...map.invasionAreas,
      Normandy: [...(map.invasionAreas.Normandy ?? []), 'A30'],
    };
    expect(messages(validateMap({ ...map, invasionAreas: areas }))).toEqual([
      'error: A30 is in both North Sea and Normandy',
    ]);
  });

  it('flags red numbers that are not at sea or point out to sea', () => {
    const map = finishedMap();
    const supply = {
      ...map.supply,
      K16: { to: 'K17', capacity: 5, boxed: true },
      A30: { to: 'A31', capacity: 2, boxed: false },
    };
    expect(messages(validateMap({ ...map, supply }))).toEqual([
      "error: The 2 in A30 points to A31, which isn't land",
      "error: The boxed 5 in K16 isn't printed at sea",
    ]);
  });

  it('flags a beach arrow that skips a hex, or a beach outside every area', () => {
    const map = finishedMap({ terrain: { A40: 'sea' } });
    const supply = {
      ...map.supply,
      A40: { to: 'C40', capacity: 2, boxed: false },
    };
    expect(messages(validateMap({ ...map, supply }))).toEqual([
      "warning: The 2 in A40 points to C40, which isn't next to it",
      "warning: The 2 in A40 isn't in an invasion area",
    ]);
  });

  it('allows a boxed number to point further away', () => {
    const map = finishedMap({ terrain: { A40: 'sea' } });
    const supply = { ...map.supply, A40: { to: 'D40', capacity: 25, boxed: true } };
    expect(validateMap({ ...map, supply })).toEqual([]);
  });

  it('flags an invasion area with nothing to assault from', () => {
    const map = finishedMap();
    const supply = { ...map.supply, A30: { to: 'B30', capacity: 2, boxed: true } };
    expect(messages(validateMap({ ...map, supply }))).toEqual([
      'warning: North Sea has no unboxed red numbers to assault from',
    ]);
  });

  it('flags ports with no hexes, hexes at sea or no boxed number', () => {
    const map = finishedMap({ terrain: { K16: 'sea' } });
    const ports = {
      Bremen: { letter: 'B', hexes: [] },
      Rouen: { letter: 'R', hexes: ['K16', 'K17'] },
    };
    expect(messages(validateMap({ ...map, ports }))).toEqual([
      'warning: Bremen has no B hexes',
      'error: Rouen has R hexes not on land',
      'warning: Rouen has no boxed number',
    ]);
  });
});
