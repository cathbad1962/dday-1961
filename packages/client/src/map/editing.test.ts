import { parseHex, parseHexside } from '@dday/engine';
import { describe, expect, it } from 'vitest';
import {
  addPort,
  eraseSupplyArrows,
  paintArea,
  paintHexes,
  paintHexsides,
  paintPort,
  paintStars,
  paintStroke,
  removePort,
  setSupplyArrow,
  strokeAdds,
  type EditableMap,
} from './editing';
import { hexCentre } from './geometry';

const empty: EditableMap = {
  terrain: {},
  hexsides: {},
  stars: [],
  supply: {},
  ports: {},
  invasionAreas: {},
};
const hexes = (...labels: string[]) => labels.map(parseHex);

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

describe('drawing hexsides', () => {
  it('draws, replaces and erases hexsides', () => {
    const river = paintHexsides({}, [parseHexside('K16/L16')], 'river');
    expect(river).toEqual({ 'K16/L16': 'river' });
    const line = paintHexsides(river, [parseHexside('K16/L16')], 'rhine-ijssel');
    expect(line).toEqual({ 'K16/L16': 'rhine-ijssel' });
    expect(paintHexsides(line, [parseHexside('K16/L16')], 'erase-hexside')).toEqual({});
  });

  it('ignores hexsides off the board', () => {
    expect(paintHexsides({}, [parseHexside('RR2/SS2')], 'river')).toEqual({});
  });
});

describe('paint strokes', () => {
  const k16 = hexCentre(parseHex('K16'));
  const l16 = hexCentre(parseHex('L16'));
  const edge = { x: (k16.x + l16.x) / 2, y: (k16.y + l16.y) / 2 };

  it('paints the hex under a click with a terrain tool', () => {
    expect(paintStroke(empty, null, k16, 'city').terrain).toEqual({ K16: 'city' });
  });

  it('fills the hexes between two points of a fast drag', () => {
    const k18 = hexCentre(parseHex('K18'));
    expect(paintStroke(empty, k16, k18, 'sea').terrain).toEqual({
      K16: 'sea',
      K17: 'sea',
      K18: 'sea',
    });
  });

  it('draws the hexside under a click with a hexside tool', () => {
    const drawn = paintStroke(empty, null, edge, 'river');
    expect(drawn).toEqual({ ...empty, hexsides: { 'K16/L16': 'river' } });
  });

  it('draws nothing when a hexside tool clicks the middle of a hex', () => {
    expect(paintStroke(empty, null, k16, 'river')).toBe(empty);
  });
});

describe('board markings', () => {
  it('adds and removes stars, ignoring hexes off the board', () => {
    const starred = paintStars(empty, hexes('K16', 'K17', 'SS2'), true);
    expect(starred.stars).toEqual(['K16', 'K17']);
    expect(paintStars(starred, hexes('K16'), false).stars).toEqual(['K17']);
    expect(paintStars(starred, hexes('K16'), true)).toBe(starred);
  });

  it('moves a hex out of one invasion area when it is added to another', () => {
    const normandy = paintArea(empty, hexes('K16', 'K17'), 'Normandy', true);
    const moved = paintArea(normandy, hexes('K17'), 'Brittany', true);
    expect(moved.invasionAreas).toEqual({ Normandy: ['K16'], Brittany: ['K17'] });
    expect(paintArea(moved, hexes('K16'), 'Normandy', false).invasionAreas.Normandy).toEqual([]);
  });

  it('adds ports and paints their letter hexes', () => {
    const withPort = addPort(empty, ' Rouen ', 'R');
    expect(withPort.ports).toEqual({ Rouen: { letter: 'R', hexes: [] } });
    expect(addPort(withPort, 'Rouen', 'X')).toBe(withPort);
    expect(addPort(withPort, 'Rotterdam', 'r')).toBe(withPort);
    const painted = paintPort(withPort, hexes('K16'), 'Rouen', true);
    expect(painted.ports.Rouen?.hexes).toEqual(['K16']);
  });

  it('unlinks red numbers from a port that is removed', () => {
    const withPort = addPort(empty, 'Rouen', 'R');
    const linked = setSupplyArrow(withPort, parseHex('K16'), parseHex('K17'), {
      capacity: 7,
      boxed: true,
      port: 'Rouen',
    });
    const removed = removePort(linked, 'Rouen');
    expect(removed.ports).toEqual({});
    expect(removed.supply).toEqual({ K16: { to: 'K17', capacity: 7, boxed: true } });
  });

  it('prints a red number with an arrow, and erases it', () => {
    const arrow = { capacity: 5, boxed: false };
    const printed = setSupplyArrow(empty, parseHex('K16'), parseHex('K17'), arrow);
    expect(printed.supply).toEqual({ K16: { to: 'K17', capacity: 5, boxed: false } });
    expect(setSupplyArrow(empty, parseHex('K16'), parseHex('K16'), arrow)).toBe(empty);
    expect(eraseSupplyArrows(printed, hexes('K16')).supply).toEqual({});
  });

  it('removes a marking when a drag starts on a hex that has it', () => {
    const options = { area: 'Normandy', port: null } as const;
    const k16 = hexCentre(parseHex('K16'));
    expect(strokeAdds(empty, k16, 'star', options)).toBe(true);
    expect(strokeAdds(paintStars(empty, hexes('K16'), true), k16, 'star', options)).toBe(false);
    const inArea = paintArea(empty, hexes('K16'), 'Normandy', true);
    expect(strokeAdds(inArea, k16, 'area', options)).toBe(false);
  });
});
