import { boardHexes, formatHexside, parseHex, parseHexside } from '@dday/engine';
import { describe, expect, it } from 'vitest';
import {
  fitView,
  hexAtPoint,
  hexCentre,
  hexsideAtPoint,
  hexsidePath,
  hexsidesAlong,
  HEX_SIZE,
  panView,
  screenToMap,
  zoomView,
  type Point,
} from './geometry';

function between(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** The two ends of a hexside, read back from its path. */
function corners(label: string): [Point, Point] {
  const [x1, y1, x2, y2] = (hexsidePath(parseHexside(label)).match(/-?[\d.]+(e-?\d+)?/g) ?? []).map(
    Number,
  );
  return [
    { x: x1 ?? NaN, y: y1 ?? NaN },
    { x: x2 ?? NaN, y: y2 ?? NaN },
  ];
}

describe('hex layout', () => {
  it('puts the east up the screen and the south to the right', () => {
    const cherbourg = hexCentre(parseHex('K16'));
    const east = hexCentre(parseHex('L16'));
    const south = hexCentre(parseHex('K17'));
    expect(east.x).toBeCloseTo(cherbourg.x);
    expect(east.y).toBeCloseTo(cherbourg.y - Math.sqrt(3) * HEX_SIZE);
    expect(south.x).toBeCloseTo(cherbourg.x + 1.5 * HEX_SIZE);
    expect(south.y).toBeCloseTo(cherbourg.y - (Math.sqrt(3) / 2) * HEX_SIZE);
  });

  it('finds the hex containing a point', () => {
    for (const label of ['K16', 'QQ2', 'r47', 'z30']) {
      const hex = parseHex(label);
      const { x, y } = hexCentre(hex);
      expect(hexAtPoint({ x: x + HEX_SIZE * 0.6, y })).toEqual(hex);
    }
  });
});

describe('hexsides on screen', () => {
  it('draws a hexside between the two corners the hexes share', () => {
    const [a, b] = corners('K16/L16');
    const k16 = hexCentre(parseHex('K16'));
    const l16 = hexCentre(parseHex('L16'));
    for (const corner of [a, b]) {
      expect(Math.hypot(corner.x - k16.x, corner.y - k16.y)).toBeCloseTo(HEX_SIZE);
      expect(Math.hypot(corner.x - l16.x, corner.y - l16.y)).toBeCloseTo(HEX_SIZE);
    }
  });

  it('finds the hexside under a point anywhere along it', () => {
    const [a, b] = corners('K16/K17');
    for (const t of [0.15, 0.5, 0.85]) {
      expect(hexsideAtPoint(between(a, b, t))).toEqual(parseHexside('K16/K17'));
    }
  });

  it('finds no hexside near the middle of a hex', () => {
    expect(hexsideAtPoint(hexCentre(parseHex('K16')))).toBeNull();
  });

  it('finds no hexside right at a corner, where three meet', () => {
    const [corner] = corners('K16/L16');
    expect(hexsideAtPoint(corner)).toBeNull();
  });

  it('follows a drag along a river', () => {
    // K16, L16 and L15 meet at one corner: drag along K16/L16 to it, then on along L15/K16.
    const [a, b] = corners('K16/L16');
    const next = corners('L15/K16');
    const isShared = (p: Point) => next.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-6);
    const middle = isShared(a) ? a : b;
    const start = middle === a ? b : a;
    const end = next.find((q) => Math.hypot(q.x - middle.x, q.y - middle.y) > 1e-6) ?? middle;
    const sides = [...hexsidesAlong(start, middle), ...hexsidesAlong(middle, end)];
    const labels = new Set(sides.map(formatHexside));
    expect(labels).toEqual(new Set(['K16/L16', 'L15/K16']));
  });
});

describe('map view', () => {
  it('converts screen points to map units', () => {
    const view = { x: 40, y: 900, scale: 0.75 };
    const point = { x: 12, y: -30 };
    const screen = { x: point.x * view.scale + view.x, y: point.y * view.scale + view.y };
    const converted = screenToMap(view, screen);
    expect(converted.x).toBeCloseTo(point.x);
    expect(converted.y).toBeCloseTo(point.y);
  });

  it('fits the whole board inside the viewport', () => {
    const hexes = boardHexes();
    const viewport = { width: 1280, height: 720 };
    const view = fitView(hexes, viewport);
    for (const hex of hexes) {
      const { x, y } = hexCentre(hex);
      const screenX = x * view.scale + view.x;
      const screenY = y * view.scale + view.y;
      expect(screenX).toBeGreaterThan(0);
      expect(screenX).toBeLessThan(viewport.width);
      expect(screenY).toBeGreaterThan(0);
      expect(screenY).toBeLessThan(viewport.height);
    }
  });

  it('pans by pixels', () => {
    expect(panView({ x: 1, y: 2, scale: 3 }, 10, -5)).toEqual({ x: 11, y: -3, scale: 3 });
  });

  it('keeps the point under the cursor still while zooming', () => {
    const view = { x: 30, y: -40, scale: 1.5 };
    const anchor = { x: 200, y: 100 };
    const zoomed = zoomView(view, 2, anchor);
    expect((anchor.x - zoomed.x) / zoomed.scale).toBeCloseTo((anchor.x - view.x) / view.scale);
    expect((anchor.y - zoomed.y) / zoomed.scale).toBeCloseTo((anchor.y - view.y) / view.scale);
  });

  it('stops zooming at the limits', () => {
    const view = { x: 0, y: 0, scale: 1 };
    expect(zoomView(view, 1000, { x: 0, y: 0 }).scale).toBe(8);
    expect(zoomView(view, 0.001, { x: 0, y: 0 }).scale).toBe(0.2);
  });
});
