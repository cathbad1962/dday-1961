import { parseHex, parseHexside } from '@dday/engine';
import { describe, expect, it } from 'vitest';
import { paintHexes, paintHexsides, paintStroke } from './editing';
import { hexCentre } from './geometry';

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
  const empty = { terrain: {}, hexsides: {} };
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
    expect(drawn).toEqual({ terrain: {}, hexsides: { 'K16/L16': 'river' } });
  });

  it('draws nothing when a hexside tool clicks the middle of a hex', () => {
    expect(paintStroke(empty, null, k16, 'river')).toBe(empty);
  });
});
