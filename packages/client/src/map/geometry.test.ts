import { boardHexes, parseHex } from '@dday/engine';
import { describe, expect, it } from 'vitest';
import { fitView, hexCentre, HEX_SIZE, panView, zoomView } from './geometry';

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
});

describe('map view', () => {
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
